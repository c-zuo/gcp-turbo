# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
locals {
  sd_environments = compact([for env in var.environments : var.monitoring_projects[env] != "" ? env : ""])
}
resource "null_resource" "stackdriver_account" {
  for_each = toset(local.sd_environments)

  provisioner "local-exec" {
    environment = {
      SD_API_KEY = var.api_key
    }
    command = format("python3 ${path.root}/../scripts/monitoring-account.py --host-project-id %s %s", var.monitoring_projects[each.value], var.project_ids_full[index(var.environments, each.value)])
  }
}

locals {
  mg_environments            = compact([for env in var.environments : var.monitoring_groups[env] != "" ? env : ""])
  filtered_monitoring_groups = { for env in local.mg_environments : env => var.monitoring_groups[env] if var.monitoring_groups[env] != "" }
  monitoring_groups = var.only_add_project ? [[{}]] : [for env in local.mg_environments :
    [for env, group in local.filtered_monitoring_groups :
      { for g in var.project_groups[env] : "${env}-${group}-${g[0].id}" => {
        "env"   = env
        "group" = group
        "g"     = g[0].id
      } }
    ]
  ]
  monitoring_group_ids = var.only_add_project ? {} : { for env, monitoring_group in local.filtered_monitoring_groups : "${env}-${monitoring_group}" => [
    for group in var.all_groups : group.group_key[0].id == format("%s%s", monitoring_group, var.domain != "" ? format("@%s", var.domain) : "") ? group.name : ""
  ] }
}

resource "google_cloud_identity_group_membership" "monitoring_group_membership" {
  provider = google-beta
  for_each = length(local.monitoring_groups) > 0 ? merge(flatten(local.monitoring_groups)...) : {}

  group = coalesce(local.monitoring_group_ids["${each.value.env}-${each.value.group}"]...)

  member_key {
    id = lower(each.value.g)
  }

  roles {
    name = "MEMBER"
  }
}
