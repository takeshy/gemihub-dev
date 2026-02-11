resource "google_dns_managed_zone" "default" {
  name        = "gemihub-online"
  dns_name    = "${var.domain}."
  description = "DNS zone for ${var.domain}"

  depends_on = [google_project_service.apis]
}

resource "google_dns_record_set" "a" {
  name         = "${var.domain}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = [google_compute_global_address.default.address]
}

resource "google_dns_record_set" "txt_verification" {
  count = var.google_site_verification_token == "" ? 0 : 1

  name         = "${var.domain}."
  type         = "TXT"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = ["\"google-site-verification=${var.google_site_verification_token}\""]
}
