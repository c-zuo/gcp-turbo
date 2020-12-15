# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
locals {
  groups_processed = flatten([for env in var.environments : [for group, members in var.groups : {
    "id"          = "${env}-${group}"
    "group"       = group
    "environment" = env
    "group_key"   = format("%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", env), "%group%", group), var.domain != "" ? format("@%s", var.domain) : "")
    "members"     = members
    }
  ]])
  groups = { for group in local.groups_processed : group.id => group }
  members = merge(flatten([for id, group in local.groups : [{ for member in group.members : "${id}-${member}" => {
    "group_key" = group.group_key
    "group_id"  = group.id
    "member"    = format("%s%s", member, var.domain != "" ? format("@%s", var.domain) : "")
    }
  }]])...)
  groups_for_permissions = { for group, members in var.groups : group => group }
  project_permissions    = { for group, settings in var.groups_permissions : group => lookup(settings, "commonIamPermissions", lookup(settings, "projectIamPermissions", [])) }
  group_permissions      = { for group, members in var.groups : group => lookup(var.groups_permissions[group], "commonIamPermissions", lookup(var.groups_permissions[group], "projectIamPermissions", [])) }
  compute_sa_permissions = { for group, settings in var.groups_permissions : group => lookup(settings, "computeDefaultSAPermissions", []) }
  project_sa_permissions = { for group, settings in var.groups_permissions : group => lookup(settings, "projectDefaultSAPermissions", []) }
  main_group             = { for env in var.environments : env => format("%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", env), "%group%", var.main_group), var.domain != "" ? format("@%s", var.domain) : "") }
  owner_group            = var.owner_group == "" || var.owner == "" ? {} : { for env in var.environments : env => format("%s%s", replace(replace(replace(var.group_format, "%project%", var.project_id), "%env%", env), "%group%", var.owner_group), var.domain != "" ? format("@%s", var.domain) : "") }
  owner                  = var.owner == "" ? "" : format("%s%s", var.owner, var.domain != "" ? format("@%s", var.domain) : "")
  environments           = length(var.groups) > 0 ? var.environments : []
}

/**
 * Create project groups for different access groups
 */
resource "google_cloud_identity_group" "project_groups" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.groups

  display_name = format("%s: %s (%s)", title(each.value.group), var.project_id, upper(each.value.environment))

  parent = format("customers/%s", var.customer_id)

  group_key {
    id = each.value.group_key
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

/**
 * Add members to project groups
 */
resource "google_cloud_identity_group_membership" "project_groups_membership" {
  provider = google-beta
  for_each = var.only_add_permissions || local.members == null ? {} : local.members

  group = google_cloud_identity_group.project_groups[each.value.group_id].id

  member_key {
    id = lower(each.value.member)
  }

  roles {
    name = "MEMBER"
  }
}

/**
 * Add IAM permissions to project groups
 */
module "iam" {
  for_each = local.group_permissions
  source   = "../iam/"

  domain       = var.domain
  group_format = var.group_format

  project_ids_full = var.project_ids_full
  project_id       = var.project_id
  environments     = var.environments

  group = local.groups_for_permissions[each.key]

  project_permissions = each.value
  extra_permissions   = lookup(var.groups_permissions[each.key], "perEnvironmentIamPermissions", {}) != {} ? lookup(var.groups_permissions[each.key].perEnvironmentIamPermissions, var.folder, {}) : {}

  service_accounts       = var.service_accounts
  compute_sa_permissions = local.compute_sa_permissions[each.key]
  project_sa_permissions = local.project_sa_permissions[each.key]

  depends_on = [google_cloud_identity_group.project_groups]
}

/**
 * Create the main group, which is a convienience group for all project members
 */
resource "google_cloud_identity_group" "project_main_group" {
  provider = google-beta
  for_each = var.only_add_permissions ? toset([]) : toset(var.environments)

  display_name = format("%s (%s)", var.project_id, upper(each.value))

  parent = format("customers/%s", var.customer_id)

  group_key {
    id = local.main_group[each.value]
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

/** 
 * Add created groups to a convenience group that contains all members
 * of the project.
 */
resource "google_cloud_identity_group_membership" "project_main_group_membership" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.groups

  group = google_cloud_identity_group.project_main_group[each.value.environment].id

  member_key {
    id = lower(google_cloud_identity_group.project_groups[each.value.id].group_key[0].id)
  }

  roles {
    name = "MEMBER"
  }
}

/**
 * Create the owner group, which is a convienience group for the project owner
 */
resource "google_cloud_identity_group" "project_owner_group" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.owner_group

  display_name = format("Owners: %s (%s)", var.project_id, upper(each.key))

  parent = format("customers/%s", var.customer_id)

  group_key {
    id = each.value
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

resource "google_cloud_identity_group_membership" "project_owner_group_membership" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : local.owner_group

  group = lower(google_cloud_identity_group.project_owner_group[each.key].id)

  member_key {
    id = local.owner
  }

  roles {
    name = "MEMBER"
  }
}



/** 
 * Add created groups to the Shared VPC group that has the necessary permissions on the 
 * Shared VPC host project
 */
locals {
  filtered_shared_vpc_groups = { for env in local.environments : env => var.shared_vpc_groups[env] if var.shared_vpc_groups[env] != "" }
  svpc_group_ids = { for env, svpc_group in local.filtered_shared_vpc_groups : env => [
    for group in var.all_groups : group.group_key[0].id == format("%s%s", svpc_group, var.domain != "" ? format("@%s", var.domain) : "") ? group.name : ""
  ] }
}

resource "google_cloud_identity_group_membership" "shared_vpc_group_membership" {
  provider = google-beta
  for_each = var.only_add_permissions ? {} : length(local.filtered_shared_vpc_groups) > 0 ? local.groups : {}

  group = coalesce(local.svpc_group_ids[each.value.environment]...)

  member_key {
    id = lower(google_cloud_identity_group.project_groups[each.value.id].group_key[0].id)
  }

  roles {
    name = "MEMBER"
  }
}
