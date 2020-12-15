# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
/**
 * Add correct permissions to the service account
 */

locals {
  permissions = setproduct(var.environments, var.project_permissions)
}

resource "google_project_iam_member" "sa-project-permissions" {
  count = length(local.permissions)

  project = var.project_ids_full[index(var.environments, local.permissions[count.index][0])]
  role    = local.permissions[count.index][1]

  member = format("serviceAccount:%s", var.service_accounts[index(var.environments, local.permissions[count.index][0])])
}
