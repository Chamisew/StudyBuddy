# Comprehensive Google Authentication Fix Guide

## Current Issue

You're experiencing a "redirect_uri_mismatch" error when trying to sign in with Google. This is a common configuration issue that can be resolved by properly setting up your Google Cloud Console.

## Immediate Solution Steps

### Step 1: Verify and Update Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (rnsb-3261a)
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID (the one with client ID: `234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r`)
5. Click the pencil icon to edit
6. In the "Authorized redirect URIs" section, add ALL of these URIs:
   ```
   http://localhost:8081/signin
   https://auth.expo.io/@anonymous/my-firebase-app
   http://localhost:19006
   ```
7. Click "Save"

### Step 2: Wait for Propagation

After saving changes in Google Cloud Console, wait 5-10 minutes for the changes to propagate.

### Step 3: Restart Development Server

1. Stop your current development server (Ctrl+C)
2. Clear Expo cache: `npx expo start -c`
3. Restart development server: `npx expo start`

### Step 4: Test on Device (Recommended)

Google Sign-In works best on actual devices:
1. Install Expo Go app on your phone
2. Scan the QR code from your development server
3. Try Google Sign-In on your device

## If the Issue Persists

### Check 1: Verify Environment Variables

Ensure your [.env](file:///d:/StuddyBuddy/.env) file contains:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:8081/signin
```

### Check 2: Verify app.json Configuration

Ensure your [app.json](file:///d:/StuddyBuddy/app.json) contains:
```json
"extra": {
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com",
  "EXPO_PUBLIC_GOOGLE_REDIRECT_URI": "http://localhost:8081/signin"
}
```

### Check 3: Enable Google Sign-In in Firebase

1. Go to Firebase Console
2. Navigate to Authentication > Sign-in method
3. Ensure Google is enabled
4. Verify your support email is set

## Common Mistakes to Avoid

1. **Incomplete URI List**: Make sure you add ALL required URIs, not just one
2. **Typographical Errors**: Ensure there are no extra spaces or characters
3. **Not Waiting for Propagation**: Changes in Google Cloud Console take time to propagate
4. **Testing Only on Web**: Google Sign-In often works better on devices

## Additional Debugging

### Enable Detailed Logging

Add this to your sign-in page for more information:
```javascript
useEffect(() => {
  console.log('Google OAuth Config:');
  console.log('Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  console.log('Redirect URI:', process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI);
}, []);
```

### Check Network Requests

Use browser developer tools to inspect network requests when clicking the Google Sign-In button.

## Alternative Solutions

### Solution 1: Use Expo Proxy

If the direct approach doesn't work, try using Expo's auth proxy:
1. Remove the `redirectUri` from your Google auth configuration
2. Set `useProxy: true`
3. Let Expo handle the redirect automatically

### Solution 2: Create New OAuth Client

If nothing else works:
1. Delete your existing OAuth client in Google Cloud Console
2. In Firebase Console, disable and re-enable Google Sign-In
3. Firebase will automatically create a new OAuth client
4. Update your configuration with the new client ID

## Resources

- [FIX_REDIRECT_URI_MISMATCH.md](file:///d:/StuddyBuddy/FIX_REDIRECT_URI_MISMATCH.md) - Specific redirect URI mismatch fix
- [google-cloud-console-setup.md](file:///d:/StuddyBuddy/google-cloud-console-setup.md) - Detailed Google Cloud Console setup
- [google-signin-dismiss-issue.md](file:///d:/StuddyBuddy/google-signin-dismiss-issue.md) - General dismissal issue troubleshooting

## Expected Outcome

After completing these steps, when you click "Sign in with Google":
1. You should see a list of Google accounts
2. After selecting an account, you should be redirected back to your app
3. You should be successfully signed in and redirected to the home page

The redirect_uri_mismatch error should be resolved once the correct URIs are authorized in Google Cloud Console.