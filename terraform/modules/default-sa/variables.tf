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

variable "service_accounts" {
  type        = list(string)
  description = "Names of default Compute Engine service account"
}

variable "project_permissions" {
  type        = list(string)
  description = "List of permissions in the project"
}
