output "shared_vpc" {
  value = google_compute_shared_vpc_service_project.service_project[*].id
}
