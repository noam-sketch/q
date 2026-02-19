# Guide: Moving to Blaze Plan & Built-in API Key

I have architected the system to support a **Built-in API Key** using modern **Firebase Secrets Manager**.

## 1. Upgrade to Blaze Plan
*   **Action:** Go to the [Firebase Console Usage Details](https://console.firebase.google.com/project/qcli-ai/usage/details).
*   **Step:** Switch your project plan from **Spark** (Free) to **Blaze** (Pay-as-you-go).
*   **Reason:** Cloud Functions requires Blaze to make external network calls and use Secret Manager.

## 2. Configure the Built-in Key (Secrets)
We now use **Cloud Secret Manager** instead of the deprecated `functions.config()`. This is more secure and future-proof.

*   **Command:** Run this in your terminal:
    ```bash
    firebase functions:secrets:set GEMINI_API_KEY
    ```
    *You will be prompted to paste your API Key.*

## 3. Deploy the Backend
Deploy the Cloud Function. The first time you use secrets, it may ask for permission to enable the Secret Manager API.

*   **Command:**
    ```bash
    cd web-q && firebase deploy --only functions
    ```

## 4. Verification
*   **Frontend Logic:** If a user *does not* provide a key in settings, the app automatically attempts to contact your backend endpoint (`/v1/query`).
*   **Backend Logic:** The function securely retrieves `GEMINI_API_KEY` from Secret Manager and proxies the request.

**Security Note:**
The endpoint uses your quota. Consider adding App Check or CORS restrictions in `web-q/functions/index.js` before wide release.