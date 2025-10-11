# Fix Redirect URI Mismatch Error

## Error Details

You're seeing this error:
```
Error 400: redirect_uri_mismatch
```

This means Google's authentication service received a request with a redirect URI (`http://localhost:8081/signin`) that isn't authorized in your Google Cloud Console.

## Solution

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (rnsb-3261a)
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID (the one with your client ID: `234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r`)
5. Click the pencil icon to edit
6. Add this exact URI to "Authorized redirect URIs":
   ```
   http://localhost:8081/signin
   ```
7. Also add these commonly used URIs:
   ```
   https://auth.expo.io/@anonymous/my-firebase-app
   http://localhost:19006
   ```
8. Click "Save"

### Step 2: Restart Your Development Server

After updating the configuration:
1. Stop your current development server (Ctrl+C)
2. Clear the Expo cache: `npx expo start -c`
3. Restart your development server: `npx expo start`

### Step 3: Test Google Sign-In

Try signing in with Google again. The redirect URI mismatch error should now be resolved.

## Why This Happens

Google requires all redirect URIs to be explicitly authorized for security reasons. When your app tries to authenticate with Google, it tells Google where to redirect back to after authentication. If that URI isn't in the authorized list, Google shows the redirect_uri_mismatch error.

## Additional Notes

- Changes in Google Cloud Console may take a few minutes to propagate
- Make sure there are no extra spaces or characters in the URIs
- The URI must match exactly what your application is sending

## If You Still See Errors

1. Double-check that the URI was added correctly (exact match)
2. Wait a few minutes for Google Cloud Console changes to propagate
3. Check your browser's developer console for more detailed error messages
4. Make sure you're not using any browser extensions that might interfere with authentication