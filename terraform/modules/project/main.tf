locals {
  project_id     = replace(replace(var.project_id_format, "%id%", var.project_id), "%folder%", lower(var.folder))
  owner          = lower(replace(replace(var.owner, "@", "_at_"), ".", "-"))
  default_labels = { for k, v in var.default_labels : k => replace(replace(replace(v, "%id%", var.project_id), "%folder%", lower(var.folder)), "%owner%", local.owner) }
}

module "project-factory" {
  count = length(var.environments)

  source = "../terraform-google-project-factory/"
  # version = "~> 9.0"

  name              = format("%s - %s", upper(var.environments[count.index]), var.display_name)
  project_id        = replace(local.project_id, "%env%", var.environments[count.index])
  random_project_id = var.add_randomness

  org_id                  = var.organization_id
  folder_id               = var.folder_ids[var.environments[count.index]]
  billing_account         = var.billing_account
  auto_create_network     = lookup(var.auto_create_network, var.environments[count.index], false)
  default_service_account = "deprivilege"

  labels = merge(var.labels, merge(local.default_labels, map(var.environment_label, var.environments[count.index])))

  activate_apis = var.activate_apis

  budget_alert_pubsub_topic     = lookup(var.budget_alert_pubsub_topics, var.environments[count.index], "")
  budget_alert_spent_percents   = var.budget_alert_spent_percents
  budget_amount                 = var.budget != null ? lookup(var.budget, var.environments[count.index], null) : null
  budget_credit_types_treatment = "EXCLUDE_ALL_CREDITS"

  vpc_service_control_attach_enabled = var.vpcsc_perimeters[var.environments[count.index]] != "" ? true : false
  vpc_service_control_perimeter_name = var.vpcsc_perimeters[var.environments[count.index]] != "" ? var.vpcsc_perimeters[var.environments[count.index]] : ""
}

locals {
  metadata = [for env in var.environments : { for mk, mv in var.metadata : "${env}-${mk}" => {
    env   = env
    name  = mk
    value = mv
  } }]
}

resource "google_compute_project_metadata_item" "project_metadata" {
  for_each = merge(local.metadata...)

  project = module.project-factory[index(var.environments, each.value.env)].project_id
  key     = each.value.name
  value   = each.value.value
}

locals {
  ec_owner = format("%s%s", var.owner, var.domain != "" ? format("@%s", var.domain) : "")
}

resource "null_resource" "essential_contacts" {
  count = length(var.essential_contact_categories) > 0 ? (var.api_key != "" ? length(var.environments) : 0) : 0

  provisioner "local-exec" {
    environment = {
      EC_API_KEY = var.api_key
    }
    command = format("python3 ${path.root}/../scripts/essential-contacts.py --categories %s --contacts %s %s", join(" ", var.essential_contact_categories), local.ec_owner, module.project-factory[count.index].project_id)
  }
}

