# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#
variable "monitoring_api_key" {
  type        = string
  description = "API key for Cloud Monitoring (Stackdriver) Accounts API"
}

variable "essential_contacts_api_key" {
  type        = string
  description = "API key for Essential Contacts API"
  default     = ""
}

variable "gcp_access_token" {
  type        = string
  description = "GCP access token (eg. use Vault)"
  default     = null
}
