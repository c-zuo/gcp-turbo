# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#

/**
 * Add permissions to a project group */

locals {
  permissions            = { for index, group in setproduct(var.environments, var.project_permissions) : "${var.group}-${group[0]}-${group[1]}-${index}" => group }
  compute_sa_permissions = { for index, group in setproduct(var.environments, var.compute_sa_permissions) : "${var.group}-${group[0]}-${group[1]}-${index}" => group }
  project_sa_permissions = { for index, group in setproduct(var.environments, var.project_sa_permissions) : "${var.group}-${group[0]}-${group[1]}-${index}" => group }
  extra_permissions = [for env in var.environments :
    { for permission in lookup(var.extra_permissions, env, []) :
      "${var.group}-${env}-${permission}" => [env, permission]
    }
  ]
}

/**
 * Add correct permissions to project groups
 */
resource "google_project_iam_member" "project_permissions" {
  for_each = local.permissions

  project = var.project_ids_full[index(var.environments, each.value[0])]
  role    = each.value[1]

  member = format("group:%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", each.value[0]), "%group%", var.group), var.domain != "" ? format("@%s", var.domain) : "")
}

resource "google_project_iam_member" "project_extra_permissions" {
  for_each = merge(local.extra_permissions...)

  project = var.project_ids_full[index(var.environments, each.value[0])]
  role    = each.value[1]

  member = format("group:%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", each.value[0]), "%group%", var.group), var.domain != "" ? format("@%s", var.domain) : "")
}

resource "google_service_account_iam_member" "compute_sa_permission" {
  for_each = local.compute_sa_permissions

  service_account_id = format("projects/%s/serviceAccounts/%s", var.project_ids_full[index(var.environments, each.value[0])], var.service_accounts.compute[index(var.environments, each.value[0])])
  role               = each.value[1]
  member             = format("group:%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", each.value[0]), "%group%", var.group), var.domain != "" ? format("@%s", var.domain) : "")
}

resource "google_service_account_iam_member" "project_sa_permission" {
  for_each = local.project_sa_permissions

  service_account_id = format("projects/%s/serviceAccounts/%s", var.project_ids_full[index(var.environments, each.value[0])], var.service_accounts.project[index(var.environments, each.value[0])])
  role               = each.value[1]
  member             = format("group:%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", each.value[0]), "%group%", var.group), var.domain != "" ? format("@%s", var.domain) : "")
}

