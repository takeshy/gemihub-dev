# Cloud Build trigger for auto-deploy on push to main
# NOTE: GitHub connection must be created manually in Cloud Console FIRST (OAuth flow required).
# Steps:
#   1. Go to Cloud Build > Triggers > Connect Repository
#   2. Authenticate with GitHub and select takeshy/gemini-hub-ide
#   3. Then uncomment and apply this resource
#
# resource "google_cloudbuild_trigger" "deploy" {
#   name     = "gemini-hub-ide-deploy"
#   location = var.region
#
#   github {
#     owner = "takeshy"
#     name  = "gemini-hub-ide"
#
#     push {
#       branch = "^main$"
#     }
#   }
#
#   filename = "cloudbuild.yaml"
#
#   substitutions = {
#     _REGION     = var.region
#     _PROJECT_ID = var.project_id
#     _SERVICE    = "gemini-hub-ide"
#     _REPO       = "gemini-hub-ide"
#   }
#
#   depends_on = [google_project_service.apis]
# }
