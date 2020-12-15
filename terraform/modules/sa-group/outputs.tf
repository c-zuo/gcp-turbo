# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
output "sa_group_id" {
  value = var.only_add_permissions ? {} : { for env in var.environments :
  env => google_cloud_identity_group.sa_group[env].id }
}

output "sa_group_keys" {
  value = var.only_add_permissions ? {} : { for env in var.environments :
  env => google_cloud_identity_group.sa_group[env].group_key }
}
