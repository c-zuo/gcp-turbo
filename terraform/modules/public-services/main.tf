# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#

locals {
  bool_policies = var.is_public_project ? [for constraint, value in var.boolean_org_policies :
    { for env in var.environments : "${env}-${constraint}" => [env, constraint, value] }
  ] : [{}]
  list_policies = var.is_public_project ? [for constraint, value in var.list_org_policies :
    { for env in var.environments : "${env}-${constraint}" => [env, constraint, value] }
  ] : [{}]
}

module "bool-org-policy" {
  source   = "terraform-google-modules/org-policy/google"
  version  = "~> 3.0.2"
  for_each = length(local.bool_policies) > 0 ? merge(local.bool_policies...) : {}

  project_id = var.project_ids_full[index(var.environments, each.value[0])]

  constraint  = each.value[1]
  policy_type = "boolean"
  policy_for  = "project"
  enforce     = each.value[2]
}

module "list-org-policy" {
  source   = "terraform-google-modules/org-policy/google"
  version  = "~> 3.0.2"
  for_each = length(local.list_policies) > 0 ? merge(local.list_policies...) : {}

  project_id = var.project_ids_full[index(var.environments, each.value[0])]

  constraint        = each.value[1]
  policy_type       = "list"
  policy_for        = "project"
  allow             = length(each.value[2]) == 0 ? [] : each.value[2]
  allow_list_length = length(each.value[2])
  enforce           = length(each.value[2]) == 0 ? false : null
}
