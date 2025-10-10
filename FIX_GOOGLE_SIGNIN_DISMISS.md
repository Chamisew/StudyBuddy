# Fix Google Sign-In Dismiss Issue

## Current Status

- Your Google OAuth Web Client ID is correct: `234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com`
- The issue is that the authentication flow gets dismissed, which typically happens due to redirect URI configuration issues

## Immediate Action Items

### 1. Update Google Cloud Console Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (rnsb-3261a)
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID (the one with your client ID)
5. Click the pencil icon to edit
6. Add these exact URIs to "Authorized redirect URIs":
   ```
   https://auth.expo.io/@anonymous/my-firebase-app
   http://localhost:19006
   http://localhost:8081/signin
   ```
7. Click "Save"

### 2. Restart Your Development Server

1. Stop your current development server (Ctrl+C)
2. Clear the Expo cache: `npx expo start -c`
3. Restart your development server: `npx expo start`

### 3. Test on Device (Recommended)

Google Sign-In works best on actual devices:
1. Install Expo Go app on your phone
2. Scan the QR code from your development server
3. Try Google Sign-In on your device

## Configuration Verification

### Environment Files

Your [.env](file:///d:/StuddyBuddy/.env) file should contain:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com
```

### App Configuration

Your [app.json](file:///d:/StuddyBuddy/app.json) file should contain:
```json
"extra": {
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com"
}
```

## If the Issue Persists

1. Check browser console for detailed error messages
2. Verify you're not using incognito/private browsing mode
3. Try with a different Google account
4. Check that your Google account isn't already signed in to another session

## Additional Resources

- [google-cloud-console-setup.md](file:///d:/StuddyBuddy/google-cloud-console-setup.md) - Detailed Google Cloud Console setup
- [google-signin-dismiss-issue.md](file:///d:/StuddyBuddy/google-signin-dismiss-issue.md) - Comprehensive troubleshooting guide

## Expected Outcome

After completing these steps, when you click "Sign in with Google":
1. You should see a list of Google accounts
2. After selecting an account, you should be redirected back to your app
3. You should be successfully signed in and redirected to the home page

The dismiss issue should be resolved once the redirect URIs are properly configured in Google Cloud Console.