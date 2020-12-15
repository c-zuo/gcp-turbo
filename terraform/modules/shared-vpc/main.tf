
locals {
  environments = compact([for env in var.environments : var.shared_vpc_projects[env] != "" ? env : ""])
}

resource "google_compute_shared_vpc_service_project" "service_project" {
  count = length(local.environments)

  host_project    = var.shared_vpc_projects[var.environments[count.index]]
  service_project = var.project_ids[count.index]
}
