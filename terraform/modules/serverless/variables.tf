variable "customer_id" {
  type        = string
  description = "Cloud Identity customer ID"
}

variable "domain" {
  type        = string
  description = "Domain to use"
}

variable "project_id" {
  type        = string
  description = "Project ID"
}

variable "project_ids_full" {
  type        = list(string)
  description = "Project IDs"
}

variable "project_numbers" {
  type        = list(string)
  description = "Project numbers"
}

variable "environments" {
  type        = list(string)
  description = "List of environments"
}

variable "sa_groups" {
  type        = map(any)
  description = "Map of Service Account groups env per group"
}

variable "serverless_groups" {
  type        = map(string)
  description = "Map of serverless groups per environment"
}

variable "serverless_service_accounts" {
  type        = list(string)
  description = "List of serverless service accounts (Cloud Functions, Cloud Run)"
}

variable "only_add_project" {
  type        = bool
  description = "If this is set, don't make groups"
  default     = false
}

variable "all_groups" {
  type        = any
  description = "All groups in CI"
}
