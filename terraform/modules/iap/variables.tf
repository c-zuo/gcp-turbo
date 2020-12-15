# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation 
# for any use or purpose. Your use of it is subject to your agreement with Google.
#

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
  description = "List of environments"
}

variable "title" {
  type        = string
  description = "Application title on consent screen"
}

variable "domain" {
  type        = string
  description = "Domain"
}

variable "email_format" {
  type        = string
  description = "Application support email format"
}

variable "customer_id" {
  type        = string
  description = "Cloud Identity customer ID"
}

variable "service_account" {
  type        = string
  description = "Terraform provisioner service account"
}
