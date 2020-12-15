# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
output "project_group_ids" {
  value = var.only_add_permissions ? {} : { for env in var.environments :
    env => { for group, members in var.groups :
    group => google_cloud_identity_group.project_groups["${env}-${group}"].id }
  }
}

output "project_group_keys" {
  value = var.only_add_permissions ? {} : { for env in var.environments :
    env => { for group, members in var.groups :
    group => google_cloud_identity_group.project_groups["${env}-${group}"].group_key }
  }
}
