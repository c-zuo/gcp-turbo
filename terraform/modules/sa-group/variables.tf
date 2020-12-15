# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
variable "domain" {
  type        = string
  description = "Domain to use"
}

variable "customer_id" {
  type        = string
  description = "Cloud Identity customer ID"
}

variable "project_id" {
  type        = string
  description = "Project ID"
}

variable "project_ids_full" {
  type        = list(string)
  description = "Project IDs (full)"
}

variable "project_numbers" {
  type        = list(string)
  description = "Project numbers"
}

variable "environments" {
  type        = list(string)
  description = "Environments"
}

variable "group_format" {
  type        = string
  default     = "%project%-serviceaccounts-%env%"
  description = "Project SA group naming format"
}

variable "add_to_shared_vpc_group" {
  type        = bool
  default     = false
  description = "Add project SA group to Shared VPC group"
}

variable "shared_vpc_groups" {
  type        = map(string)
  description = "Shared VPC groups (one for each environment)"
}

variable "service_account" {
  type        = string
  description = "Terraform provisioner service account"
}

variable "service_accounts" {
  type        = list(string)
  description = "Service accounts to add to project SA group"
}

variable "only_add_permissions" {
  type        = bool
  description = "Don't create groups, just add permissions (groups have to exist)"
  default     = false
}

variable "all_groups" {
  type        = any
  description = "All groups in CI"
}
