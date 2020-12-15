locals {
  iap_config = [for id in var.project_ids_full : var.title != "" ? id : ""]
}

resource "google_cloud_identity_group" "iap_support_group" {
  provider = google-beta

  display_name = format("IAP support: %s", title(var.project_id))

  parent = format("customers/%s", var.customer_id)

  group_key {
    id = replace(replace(var.email_format, "%domain%", var.domain), "%project%", var.project_id)
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

resource "google_cloud_identity_group_membership" "iap_support_group_membership" {
  provider = google-beta

  group = google_cloud_identity_group.iap_support_group.id

  member_key {
    id = var.service_account
  }

  roles {
    name = "OWNER"
  }

  roles {
    name = "MEMBER"
  }

  lifecycle {
    ignore_changes = [
      roles,
    ]
  }
}

resource "google_iap_brand" "project_brand" {
  for_each = toset(compact(local.iap_config))

  support_email     = google_cloud_identity_group.iap_support_group.group_key[0].id
  application_title = var.title
  project           = each.value

  depends_on = [
    google_cloud_identity_group_membership.iap_support_group_membership
  ]
}
