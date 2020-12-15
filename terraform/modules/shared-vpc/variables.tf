variable "shared_vpc_projects" {
  type        = map(string)
  description = "Shared VPC host projects"
}

variable "project_ids" {
  type        = list(string)
  description = "Shared VPC service projects"
}

variable "environments" {
  type        = list(string)
  description = "List of environments"
}
