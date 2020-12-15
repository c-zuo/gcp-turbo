terraform {
  required_version = ">= 0.13.0"

  required_providers {
    google = ">= 3.40.0"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

provider "external" {
}

provider "template" {
}

provider "tls" {
}

resource "tls_private_key" "ssh-key" {
  algorithm = "RSA"
  rsa_bits  = "4096"
}

data "google_project" "project" {
}

locals {
  private_key = split("\n", yamlencode(tls_private_key.ssh-key.private_key_pem))
  public_key  = split("\n", yamlencode(tls_private_key.ssh-key.public_key_openssh))
  # Horrible hack to force correct indentation
  private_key_indented = format("%s\n          %s", local.private_key[0], join("\n          ", slice(local.private_key, 1, length(local.private_key))))
  public_key_indented  = format("%s\n          %s", local.public_key[0], join("\n          ", slice(local.public_key, 1, length(local.public_key))))
}

data "template_file" "config" {
  template = file(var.config_template)
  vars = {
    service_account = yamlencode(google_service_account.service-account.email)
    iap_audience    = yamlencode(format("/projects/%s/global/backendServices/%s", data.google_project.project.number, data.external.audience-id.result.id))
    repository_url  = yamlencode(var.repository_url)
    ssh_private_key = local.private_key_indented
    ssh_public_key  = local.public_key_indented
    gitlab_url      = yamlencode(var.gitlab_url)
    gitlab_token    = yamlencode(var.gitlab_token)
    gitlab_project  = yamlencode(var.gitlab_project)
  }
}

resource "google_secret_manager_secret" "config-secret" {
  secret_id = format("%s-secret", var.application_name)

  replication {
    automatic = true
  }
}

data "external" "audience-id" {
  program = [
    "gcloud",
    "compute",
    "backend-services",
    "describe",
    google_compute_backend_service.application-backend.name,
    "--global",
    "--format=json(id)"
  ]
}

resource "google_secret_manager_secret_version" "config-secret-version" {
  secret = google_secret_manager_secret.config-secret.id

  secret_data = format("gzip:%s", base64gzip(data.template_file.config.rendered))
}

data "google_service_account" "deployer-account" {
  account_id = var.deployer_sa
}

resource "google_service_account_iam_member" "service-account-actas" {
  service_account_id = google_service_account.service-account.name
  role               = "roles/iam.serviceAccountUser"
  member             = format("serviceAccount:%s", data.google_service_account.deployer-account.email)
}

# Since the application is running under a custom service account in Cloud Run,
# it will get tokens from the internal metadata endpoint. These tokens are for
# scope auth/cloud-platform. We want different tokens to present to Directory
# API, so we generate the new tokens via iamcredentials.googleapis.com. To be
# able to generate tokens, the service account needs to have token creator permissions
# for itself. Kind of weird, but that's the way it is.
resource "google_service_account_iam_member" "service-account-token" {
  service_account_id = google_service_account.service-account.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = format("serviceAccount:%s", google_service_account.service-account.email)
}

resource "google_service_account" "service-account" {
  account_id   = var.service_account
  display_name = "Turbo Project Factory Application Service Account"
}

resource "google_secret_manager_secret_iam_member" "config-secret-iam" {
  secret_id = google_secret_manager_secret.config-secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = format("serviceAccount:%s", google_service_account.service-account.email)
}

resource "google_storage_bucket_iam_member" "service-account-bucket" {
  count = var.chargingcodes_bucket != "" ? 1 : 0

  bucket = var.chargingcodes_bucket
  role   = "roles/storage.objectViewer"
  member = format("serviceAccount:%s", google_service_account.service-account.email)
}

resource "google_cloud_run_service" "application" {
  name     = var.application_name
  location = var.region

  template {
    spec {
      containers {
        image = format("%s:%s", var.container, var.container_tag)

        env {
          name  = "CONFIG"
          value = format("projects/%d/secrets/%s/versions/latest", data.google_project.project.number, format("%s-secret", var.application_name))
        }

        ports {
          container_port = 8080
        }
      }
      container_concurrency = 4
      timeout_seconds       = var.request_timeout

      service_account_name = google_service_account.service-account.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  depends_on = [
    google_service_account_iam_member.service-account-actas
  ]
}

# Allow unauthenticated requests (application protected by JWT tokens and IAP)
resource "google_cloud_run_service_iam_member" "application-allow-all" {
  location = google_cloud_run_service.application.location
  project  = google_cloud_run_service.application.project
  service  = google_cloud_run_service.application.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_compute_region_network_endpoint_group" "serverless-neg" {
  provider              = google-beta
  name                  = format("%s-neg", var.application_name)
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.application.name
  }
}

resource "google_compute_global_address" "application-global-ip" {
  name = format("%s-ip", var.application_name)
}

data "google_dns_managed_zone" "dns-zone" {
  name    = var.cloud_dns_zone
  project = var.dns_project_id != "" ? var.dns_project_id : var.project_id
}

resource "google_dns_record_set" "dns-record" {
  name = format("%s.%s", var.dns_name, data.google_dns_managed_zone.dns-zone.dns_name)
  type = "A"
  ttl  = 60

  managed_zone = data.google_dns_managed_zone.dns-zone.name
  project      = var.dns_project_id != "" ? var.dns_project_id : var.project_id

  rrdatas = [google_compute_global_address.application-global-ip.address]
}

resource "google_compute_managed_ssl_certificate" "application-cert" {
  provider = google-beta

  name = format("%s-cert", var.application_name)

  managed {
    domains = [google_dns_record_set.dns-record.name]
  }
}

resource "google_compute_global_forwarding_rule" "application-global-fr" {
  name       = format("%s-fr", var.application_name)
  ip_address = google_compute_global_address.application-global-ip.address
  port_range = "443"
  target     = google_compute_target_https_proxy.application-proxy.self_link
}

resource "google_compute_target_https_proxy" "application-proxy" {
  name             = format("%s-proxy", var.application_name)
  url_map          = google_compute_url_map.application-url-map.self_link
  ssl_certificates = [google_compute_managed_ssl_certificate.application-cert.id]
}

resource "google_compute_url_map" "application-url-map" {
  name            = format("%s-urlmap", var.application_name)
  default_service = google_compute_backend_service.application-backend.self_link
}

resource "google_compute_backend_service" "application-backend" {
  name = format("%s-backend", var.application_name)

  backend {
    group = google_compute_region_network_endpoint_group.serverless-neg.id
  }

  iap {
    oauth2_client_id     = google_iap_client.application-client.client_id
    oauth2_client_secret = google_iap_client.application-client.secret
  }

  log_config {
    enable = true
  }
}

# If you get FAILED_PRECONDITION, it means the brand has been set as External.
# You'll need to create the client manually and specify it via iap_client_id
# and iap_client_secret parameters.
resource "google_iap_client" "application-client" {
  display_name = format("IAP-%s", var.application_name)
  brand        = var.iap_brand
}

