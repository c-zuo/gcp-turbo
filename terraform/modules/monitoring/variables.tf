variable "customer_id" {
  type        = string
  description = "Cloud Identity customer ID"
}

variable "domain" {
  type        = string
  description = "Domain to use"
}

variable "project_ids_full" {
  type        = list(string)
  description = "Project IDs"
}

variable "environments" {
  type        = list(string)
  description = "List of environments"
}

variable "project_groups" {
  type        = map(any)
  description = "Map of project groups env per group"
}

variable "monitoring_groups" {
  type        = map(string)
  description = "Map of monitoring groups per environment"
}

variable "monitoring_projects" {
  type        = map(string)
  description = "Map of monitoring host projects per environment"
}

variable "api_key" {
  type        = string
  description = "API key for Stackdriver Accounts API"
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
