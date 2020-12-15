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

variable "environments" {
  type        = list(string)
  description = "Environments"
}

variable "folder" {
  type        = string
  description = "Folder"
}

variable "group_format" {
  type        = string
  default     = "%project%-%group%-%env%"
  description = "Project naming format"
}

variable "groups" {
  type        = map(list(string))
  description = "Groups to provision"
}

variable "groups_permissions" {
  type        = map(any)
  description = "Group permissions"
}

variable "main_group" {
  type        = string
  description = "Group that will contain all groups"
}

variable "owner" {
  type        = string
  description = "Owner"
}

variable "owner_group" {
  type        = string
  description = "Group that will contain the owner"
}

variable "shared_vpc_groups" {
  type        = map(string)
  description = "Shared VPC groups (one for each environment)"
}

variable "service_accounts" {
  type        = map(list(string))
  description = "Service accounts"
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
