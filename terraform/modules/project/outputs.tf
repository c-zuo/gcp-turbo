output "domain" {
  value = module.project-factory[0].domain
}

output "project_ids" {
  value = module.project-factory[*].project_id
}

output "service_accounts" {
  value = module.project-factory[*].service_account_email
}

output "project_numbers" {
  value = module.project-factory[*].project_number
}
