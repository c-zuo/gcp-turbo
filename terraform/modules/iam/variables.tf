# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
variable "project_id" {
  type        = string
  description = "Project ID"
}

variable "project_ids_full" {
  type        = list(string)
  description = "Project IDs"
}

variable "environments" {
  type        = list(string)
  description = "List of environments"
}

variable "project_permissions" {
  type        = list(string)
  description = "List of project permissions"
}

variable "extra_permissions" {
  type        = map(any)
  description = "List of extra per-folder per-environment project permissions"
}

variable "group" {
  type        = string
  description = "Group to give privileges to"
}

variable "group_format" {
  type        = string
  description = "Group format"
}

variable "domain" {
  type        = string
  description = "Domain"
}

variable "service_accounts" {
  type        = map(list(string))
  description = "Service accounts"
}

variable "compute_sa_permissions" {
  type        = list(string)
  description = "Compute SA permissions"
}

variable "project_sa_permissions" {
  type        = list(string)
  description = "Project SA permissions"
}
