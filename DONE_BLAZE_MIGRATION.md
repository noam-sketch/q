# Guide: Moving to Blaze Plan & Built-in API Key

I have architected the system to support a **Built-in API Key** once you upgrade to the Blaze plan.

## 1. Upgrade to Blaze Plan
*   **Action:** Go to the [Firebase Console Usage Details](https://console.firebase.google.com/project/qcli-ai/usage/details).
*   **Step:** Switch your project plan from **Spark** (Free) to **Blaze** (Pay-as-you-go).
*   **Reason:** Cloud Functions requires Blaze to make external network calls (to Google AI) and use required build services.

## 2. Configure the Built-in Key
Once on Blaze, you can securely store your API key on the server. This allows users to visit your web app and use it *without* entering their own key.

*   **Command:** Run this in your terminal:
    ```bash
    firebase functions:config:set gemini.key="AIzaYourActualSecretAPIKeyHere"
    ```

## 3. Deploy the Backend
Now deploy the Cloud Function that acts as the secure proxy.

*   **Command:**
    ```bash
    cd web-q && firebase deploy --only functions
    ```

## 4. Verification
*   **Frontend Logic:** I have already updated the web app. If a user *does not* provide a key in settings, the app now automatically attempts to contact your backend endpoint (`/v1/query`).
*   **Backend Logic:** The function will detect that no user key was sent and will automatically use the `gemini.key` you configured in Step 2.

**Security Note:**
Currently, the endpoint is public. Once deployed, anyone can use your quota. Consider adding:
*   **App Check:** To ensure only your specific web app can call the function.
*   **CORS Restrictions:** Tighten the `origin` policy in `web-q/functions/index.js`.