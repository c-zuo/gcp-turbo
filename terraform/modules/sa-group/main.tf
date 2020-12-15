# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
locals {
  sa_group_names = { for idx, env in var.environments : env => {
    group_key = format("%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", env), "%number%", var.project_numbers[idx]), var.domain != "" ? format("@%s", var.domain) : "")
    }
  }
  sa_members = [for idx, env in var.environments :
    { for member in var.service_accounts : "${env}-${md5(member)}" => {
      env    = env
      member = replace(replace(replace(member, "%project%", var.project_ids_full[idx]), "%env%", env), "%number%", var.project_numbers[idx])
    } }
  ]

  filtered_svpc_groups = { for env in var.environments : env => var.shared_vpc_groups[env] if var.shared_vpc_groups[env] != "" }
  shared_vpc_groups = { for env, svpc_group in local.filtered_svpc_groups : env => {
    group_id = coalesce([for group in var.all_groups : group.group_key[0].id == format("%s%s", svpc_group, var.domain != "" ? format("@%s", var.domain) : "") ? group.name : ""]...)
    }
  }
}

/**
 * Create service account group
 */
resource "google_cloud_identity_group" "sa_group" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.sa_group_names

  display_name = format("Service accounts: %s (%s)", var.project_id, upper(each.key))

  parent = format("customers/%s", var.customer_id)

  group_key {
    id = each.value.group_key
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

resource "null_resource" "sa_group_externals" {
  for_each = var.only_add_permissions ? {} : local.sa_group_names

  provisioner "local-exec" {
    command = format("python3 ${path.root}/../scripts/group-allow-external-users.py %s", google_cloud_identity_group.sa_group[each.key].group_key[0].id)
  }
}

/**
 * Add TF service account as owner
 */
/*
resource "google_cloud_identity_group_membership" "sa_group_owner" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.sa_group_names

  group = google_cloud_identity_group.sa_group[each.key].name

  member_key {
    id = var.service_account
  }

  roles {
    name = "OWNER"
  }

  roles {
    name = "MEMBER"
  }

  depends_on = [
    null_resource.sa_group_externals
  ]

  lifecycle {
    ignore_changes = [
      roles,
    ]
  }
}
*/

/**
 * Add service accounts to service account group
 */
resource "google_cloud_identity_group_membership" "sa_group_membership" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : merge(local.sa_members...)

  group = google_cloud_identity_group.sa_group[each.value.env].name

  member_key {
    id = lower(each.value.member)
  }

  roles {
    name = "MEMBER"
  }

  depends_on = [
    // google_cloud_identity_group_membership.sa_group_owner,
    null_resource.sa_group_externals
  ]
}

/**
 * Add service accounts group to Shared VPC group
 */
resource "google_cloud_identity_group_membership" "sa_group_svpc_membership" {
  provider = google-beta
  for_each = local.shared_vpc_groups

  group = each.value.group_id

  member_key {
    id = google_cloud_identity_group.sa_group[each.key].group_key[0].id
  }

  roles {
    name = "MEMBER"
  }
}

