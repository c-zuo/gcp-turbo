# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
locals {
  serverless_environments    = [for env in var.environments : env if var.serverless_groups[env] != ""]
  filtered_serverless_groups = { for env in local.serverless_environments : env => var.serverless_groups[env] if var.serverless_groups[env] != "" }

  serverless_sa_groups = var.only_add_project ? {} : { for env in local.serverless_environments : env => var.sa_groups[env] }
  serverless_sa_group_ids = var.only_add_project ? {} : { for env, serverless_group in local.filtered_serverless_groups : env => [
    for group in var.all_groups : group.group_key[0].id == format("%s%s", serverless_group, var.domain != "" ? format("@%s", var.domain) : "") ? group.name : ""
  ] }

}

resource "google_cloud_identity_group_membership" "serverless_sa_group_membership" {
  provider = google-beta
  for_each = length(local.serverless_sa_groups) > 0 ? local.serverless_sa_groups : {}

  group = element(compact(local.serverless_sa_group_ids[each.key]), 0)

  member_key {
    id = lower(each.value[0].id)
  }

  roles {
    name = "MEMBER"
  }
}

locals {
  sa_members = [for idx, env in local.serverless_environments :
    { for member in var.serverless_service_accounts : "${env}-${md5(member)}" => {
      env    = env
      member = replace(replace(replace(member, "%project%", var.project_ids_full[idx]), "%env%", env), "%number%", var.project_numbers[idx])
    } }
  ]
}

resource "google_cloud_identity_group_membership" "serverless_sa_membership" {
  provider = google-beta
  for_each = length(local.sa_members) > 0 ? merge(local.sa_members...) : {}

  group = element(compact(local.serverless_sa_group_ids[each.value.env]), 0)

  member_key {
    id = each.value.member
  }

  roles {
    name = "MEMBER"
  }
}
