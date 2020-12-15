# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
terraform {
  required_version = ">= 0.13.0"

  required_providers {
    google = ">= 3.40.0"
  }
}

locals {
  config              = yamldecode(file("${path.root}/../config.yaml"))
  project_files       = fileset("${path.root}/../projects/", "*.yaml")
  projects_decoded    = [for file in local.project_files : yamldecode(file("${path.root}/../projects/${file}"))]
  projects            = { for project in local.projects_decoded : project.project.projectId => project.project if project.project.status == "active" }
  public_projects     = { for projectId, project in local.projects : projectId => lookup(project, "allowPublicServices", false) == true ? project : null }
  charging_code_label = lookup(local.config, "chargingCodeLabel", "charging-code")
}

provider "google" {
  project      = local.config.seedProject
  access_token = var.gcp_access_token
}

provider "google-beta" {
  project      = local.config.seedProject
  access_token = var.gcp_access_token
}

provider "google-beta" {
  alias        = "cloud-identity"
  project      = local.config.seedProject
  scopes       = ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/cloud-identity.groups"]
  access_token = var.gcp_access_token
}

data "google_cloud_identity_groups" "all_groups" {
  provider = google-beta
  parent   = format("customers/%s", local.config.cloudIdentityCustomerId)
}

locals {
  auto_create_network = lookup(local.config, "autoCreateNetwork", {})
}

module "project" {
  for_each = local.projects
  source   = "./modules/project"

  environments = each.value.environments

  project_id        = each.value.projectId
  project_id_format = local.config.projectIdFormat
  display_name      = each.value.displayName
  owner             = lookup(each.value, "owner", "unknown")
  default_labels    = lookup(local.config, "labels", {})
  labels            = merge(lookup(each.value, "labels", {}), map(local.charging_code_label, each.value.chargingCode))
  metadata          = lookup(local.config, "defaultProjectMetadata", {})

  organization_id             = local.config.organizationId
  folder                      = each.value.folder
  folder_ids                  = local.config.folders[each.value.folder]
  shared_vpc_projects         = local.config.sharedVpcProjects[each.value.folder]
  budget_alert_pubsub_topics  = local.config.budgetAlertTopics[each.value.folder]
  budget_alert_spent_percents = lookup(each.value, "budgetAlertSpentPercents", local.config.budgetAlertSpentPercents)
  billing_account             = local.config.billingAccount
  budget                      = lookup(each.value, "budget", lookup(local.config, "defaultBudget", null))

  activate_apis       = concat(local.config.defaultApis, lookup(each.value, "additionalApis", []))
  auto_create_network = lookup(local.auto_create_network, each.value.folder, {})

  domain                       = local.config.domain
  essential_contact_categories = lookup(local.config, "essentialContactsOwnerCategories", [])
  api_key                      = var.essential_contacts_api_key

  vpcsc_perimeters = local.config.vpcServiceControlPerimeters[each.value.folder]
}

module "groups" {
  for_each = local.projects
  source   = "./modules/groups"
  providers = {
    google-beta = cloud-identity
  }

  all_groups = data.google_cloud_identity_groups.all_groups.groups

  environments = each.value.environments

  domain           = local.config.domain
  customer_id      = local.config.cloudIdentityCustomerId
  owner            = lookup(each.value, "owner", "")
  project_id       = each.value.projectId
  project_ids_full = module.project[each.value.projectId].project_ids
  folder           = each.value.folder

  group_format      = lookup(local.config, "projectGroupFormat", "%project%-%group%-%env%")
  main_group        = lookup(local.config, "projectMainGroup", "all")
  owner_group       = lookup(local.config, "projectOwnerGroup", "")
  shared_vpc_groups = local.config.sharedVpcGroups[each.value.folder]
  groups            = lookup(local.config, "setProjectGroups", lookup(each.value, "team", {}))
  service_accounts = {
    "project" = module.project[each.value.projectId].service_accounts
    "compute" = formatlist("%d-compute@developer.gserviceaccount.com", module.project[each.value.projectId].project_numbers)
  }
  groups_permissions = local.config.projectGroups

  only_add_permissions = lookup(local.config, "onlyProjectGroupIamPermissions", false)
}

module "shared-vpc" {
  for_each = local.projects
  source   = "./modules/shared-vpc"

  environments = each.value.environments

  project_ids         = module.project[each.value.projectId].project_ids
  shared_vpc_projects = local.config.sharedVpcProjects[each.value.folder]
}

module "monitoring" {
  for_each = local.projects
  source   = "./modules/monitoring"
  providers = {
    google-beta = cloud-identity
  }

  all_groups = data.google_cloud_identity_groups.all_groups.groups

  api_key      = var.monitoring_api_key
  environments = each.value.environments

  domain      = local.config.domain
  customer_id = local.config.cloudIdentityCustomerId

  project_ids_full    = module.project[each.value.projectId].project_ids
  monitoring_projects = local.config.monitoringProjects[each.value.folder]
  monitoring_groups   = local.config.monitoringGroups[each.value.folder]

  project_groups = module.groups[each.key].project_group_keys

  only_add_project = lookup(local.config, "onlyProjectGroupIamPermissions", false)
}

module "serverless" {
  for_each = local.projects
  source   = "./modules/serverless"
  providers = {
    google-beta = cloud-identity
  }

  all_groups = data.google_cloud_identity_groups.all_groups.groups

  environments = each.value.environments

  domain           = local.config.domain
  customer_id      = local.config.cloudIdentityCustomerId
  project_id       = each.value.projectId
  project_ids_full = module.project[each.value.projectId].project_ids
  project_numbers  = module.project[each.value.projectId].project_numbers

  serverless_groups           = lookup(lookup(local.config, "sharedVpcServerlessGroups", {}), each.value.folder, {})
  sa_groups                   = module.sa-group[each.key].sa_group_keys
  serverless_service_accounts = lookup(local.config, "serverlessServiceAccounts", [])

  only_add_project = lookup(local.config, "onlyProjectGroupIamPermissions", false)
}


module "default-project-sa" {
  for_each = local.projects
  source   = "./modules/default-sa"

  environments = each.value.environments

  project_ids_full = module.project[each.value.projectId].project_ids
  service_accounts = module.project[each.value.projectId].service_accounts

  project_permissions = lookup(local.config, "defaultProjectSAPrivileges", [])
}

module "default-compute-sa" {
  for_each = local.projects
  source   = "./modules/default-sa"

  environments = each.value.environments

  project_ids_full = module.project[each.value.projectId].project_ids
  service_accounts = formatlist("%d-compute@developer.gserviceaccount.com", module.project[each.value.projectId].project_numbers)

  project_permissions = local.config.defaultComputeSAPrivileges
}

module "sa-group" {
  for_each = local.projects
  source   = "./modules/sa-group"
  providers = {
    google-beta = cloud-identity
  }

  all_groups = data.google_cloud_identity_groups.all_groups.groups

  environments = each.value.environments

  domain           = local.config.domain
  customer_id      = local.config.cloudIdentityCustomerId
  project_id       = each.value.projectId
  project_ids_full = module.project[each.value.projectId].project_ids
  project_numbers  = module.project[each.value.projectId].project_numbers

  group_format            = lookup(local.config, "projectServiceAccountGroupFormat", "%project%-serviceaccounts-%env%")
  shared_vpc_groups       = local.config.sharedVpcGroups[each.value.folder]
  service_account         = lookup(local.config, "terraformServiceAccount", "")
  service_accounts        = lookup(local.config, "projectServiceAccountGroupMembers", ["project-service-account@%project%.iam.gserviceaccount.com"])
  add_to_shared_vpc_group = lookup(local.config, "projectServiceAccountGroupJoinSharedVpc", false)

  only_add_permissions = lookup(local.config, "onlyProjectGroupIamPermissions", false)
}

module "public-services" {
  for_each = local.projects
  source   = "./modules/public-services"

  environments = each.value.environments

  project_ids_full = module.project[each.value.projectId].project_ids

  is_public_project = lookup(each.value, "allowPublicServices", false)

  boolean_org_policies = lookup(lookup(local.config, "publicServicesOrgPolicies", {}), "booleanPolicies", {})
  list_org_policies    = lookup(lookup(local.config, "publicServicesOrgPolicies", {}), "listPolicies", {})
}

module "iap" {
  for_each = local.projects

  source = "./modules/iap"

  environments = each.value.environments

  project_id       = each.value.projectId
  project_ids_full = module.project[each.value.projectId].project_ids
  domain           = local.config.domain
  customer_id      = local.config.cloudIdentityCustomerId

  title = lookup(lookup(each.value, "iap", {}), "title", "")

  email_format    = lookup(local.config, "iapSupportGroupFormat", "iap-support-%project%@%domain%")
  service_account = lookup(local.config, "terraformServiceAccount", "")
}
