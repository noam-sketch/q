# Backend Deployment Troubleshooting

The web app hosting is live and updated! However, the backend Cloud Function (`v1Query`) failed to deploy due to Google Cloud IAM permission issues.

## The Error
`Build failed: Build error details not available` or `Permission denied`.

This usually means the **Cloud Build Service Account** or **Compute Service Account** lacks permissions to read source code or write logs.

## How to Fix (Console)

1.  **Go to IAM:** [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam?project=qcli-ai)
2.  **Find the Service Accounts:** Look for accounts ending in:
    *   `@cloudbuild.gserviceaccount.com`
    *   `@developer.gserviceaccount.com` (Compute Engine default)
3.  **Grant Permissions:**
    *   **Cloud Build SA:** Add `Cloud Functions Developer` and `Service Account User`.
    *   **Compute SA:** Add `Storage Object Viewer` and `Artifact Registry Reader`.
4.  **Check Logs:** [Cloud Build Logs](https://console.cloud.google.com/cloud-build/builds?project=qcli-ai) to see the exact error.

## Once Fixed
Run the deployment command again:
```bash
cd web-q && firebase deploy --only functions
```

Your web app frontend is fully functional at [https://qcli-ai.web.app/](https://qcli-ai.web.app/). Users can still use their own API keys via the settings cog.