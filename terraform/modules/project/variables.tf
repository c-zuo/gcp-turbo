variable "environments" {
  type        = list(string)
  description = "Project environments"
}

variable "project_id" {
  type        = string
  description = "Project ID"
}

variable "display_name" {
  type        = string
  description = "Display name for project"
}

variable "organization_id" {
  type        = number
  description = "Organization ID"
}

variable "owner" {
  type        = string
  description = "Owner of the project"
}

variable "domain" {
  type        = string
  description = "Domain"
}

variable "essential_contact_categories" {
  type        = list(string)
  description = "Categories of essential contacts"
}

variable "api_key" {
  type        = string
  description = "Essential Contacts API key"
}


variable "labels" {
  type        = map(string)
  description = "Labels to add to a project"
}

variable "default_labels" {
  type        = map(string)
  description = "Default labels to add to a project"
}

variable "folder" {
  type        = string
  description = "Folder name"
}

variable "folder_ids" {
  type        = map(string)
  description = "Folder IDs"
}

variable "billing_account" {
  type        = string
  description = "Billing account ID"
}

variable "shared_vpc_projects" {
  type        = map(string)
  description = "Shared VPC projects per environment"
}

variable "budget_alert_pubsub_topics" {
  type        = map(string)
  description = "Pub/Sub billing alert topics per environment"
}

variable "budget_alert_spent_percents" {
  type        = list(number)
  description = "Percentages of budget spent when alert is triggered"
}

variable "budget" {
  type        = map(number)
  default     = null
  description = "Budget for the project"
}

variable "activate_apis" {
  type        = list(string)
  description = "APIs to activate"
}

variable "default_sa_privileges" {
  type        = string
  description = "Default Compute SA privileges (delete, deprivilege, disable, or keep)"
  default     = "deprivilege"
}

variable "vpcsc_perimeters" {
  type        = map(string)
  description = "Attach project to a VPC-SC perimeter"
  default     = null
}

variable "environment_label" {
  type        = string
  description = "Label for environment"
  default     = "env"
}

variable "metadata" {
  type        = map(string)
  description = "Default project metadata (OS Login, etc)"
  default     = {}
}


variable "add_randomness" {
  type        = bool
  description = "Add a few random characters to project ID to avoid conflicting projects"
  default     = false
}

variable "project_id_format" {
  type        = string
  description = "Project ID format"
  default     = "%id%-%env%"
}

variable "auto_create_network" {
  type        = map(bool)
  description = "Auto create default network"
}
