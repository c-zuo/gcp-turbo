# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
variable "project_ids_full" {
  type        = list(string)
  description = "Project IDs (full)"
}

variable "environments" {
  type        = list(string)
  description = "List of environments"
}

variable "is_public_project" {
  type        = bool
  description = "Project hosts public services"
}

variable "boolean_org_policies" {
  type        = map(any)
  description = "Boolean org policies"
}

variable "list_org_policies" {
  type        = map(any)
  description = "List org policies"
}
