variable "deployer_sa" {
  type        = string
  description = "Deployer service account (without domain part)"
}

variable "project_id" {
  type        = string
  description = "Project ID to deploy in"
}

variable "region" {
  type        = string
  description = "Region to deploy in"
}

variable "service_account" {
  type        = string
  description = "Service account ID"
  default     = "turbo-project-factory-app"
}

variable "application_name" {
  type        = string
  description = "Application name"
  default     = "turbo-project-factory"
}

variable "container" {
  type        = string
  description = "GCR address for Turbo Project Factory container (eg. eu.gcr.io/YOUR-PROJECT/turbo-project-factory)"
}

variable "container_tag" {
  type        = string
  description = "Container tag"
  default     = "latest"
}

variable "config_template" {
  type        = string
  description = "Config template name"
  default     = "appConfig.yaml.tmpl"
}

variable "iap_brand" {
  type        = string
  description = "IAP brand (gcloud alpha iap oauth-brands list)"
}

variable "repository_url" {
  type        = string
  description = "Git repository URL for Turbo Project Factory"
}

variable "gitlab_url" {
  type        = string
  description = "Gitlab installation base URL (ie. $CI_SERVER_URL)"
}

variable "gitlab_token" {
  type        = string
  description = "Gitlab token for admin user (requires Gitlab sudo permissions)"
}

variable "gitlab_project" {
  type        = string
  description = "Gitlab project for Turbo Project Factory (format: group/project)"
}

variable "cloud_dns_zone" {
  type        = string
  description = "Cloud DNS zone ID for adding the A record"
}

variable "dns_name" {
  type        = string
  description = "DNS hostname"
}

variable "dns_project_id" {
  type        = string
  description = "DNS project ID (if empty, use normal project)"
  default     = ""
}

variable "request_timeout" {
  type    = number
  default = 180
}

variable "chargingcodes_bucket" {
  type        = string
  description = "Charging code bucket for IAM privileges"
  default     = ""
}
