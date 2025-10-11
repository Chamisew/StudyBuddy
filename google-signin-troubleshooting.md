# Google Sign-In Troubleshooting Guide

## Common Causes of 400 Error

1. **Incorrect Client ID**: The client ID in your configuration doesn't match what's registered in the Google Cloud Console
2. **Unauthorized Redirect URI**: The redirect URI used by the app isn't authorized in the Google Cloud Console
3. **Missing Configuration**: Google Sign-In isn't properly enabled in Firebase Authentication

## Steps to Fix the 400 Error

### 1. Verify Your Google OAuth Client ID

Make sure the client ID in your [.env](file:///d:/StuddyBuddy/.env) file and [app.json](file:///d:/StuddyBuddy/app.json) is correct:

```
# In .env file
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com
```

### 2. Check Firebase Console Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Ensure **Google** is enabled
5. Check that your support email is set

### 3. Verify Google Cloud Console Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click the edit icon (pencil)
6. Under **Authorized redirect URIs**, ensure the following URIs are present:
   - For Expo development: `https://auth.expo.io/@your-username/your-project-slug`
   - For web: `http://localhost:19006` (or your development server URL)

### 4. Check Your Firebase Project Settings

1. In Firebase Console, go to **Project Settings**
2. In the **General** tab, make sure you have a web app configured
3. The client ID should match what you're using in your code

### 5. Restart Your Development Server

After making changes:
1. Stop your development server (Ctrl+C)
2. Clear the Expo cache: `npx expo start -c`
3. Restart your development server: `npx expo start`

## Debugging Tips

### Enable Detailed Logging

Add this to your sign-in page to see more detailed logs:

```javascript
useEffect(() => {
  console.log('Google Auth response:', response);
}, [response]);
```

### Check Network Requests

Use browser developer tools to inspect network requests when clicking the Google Sign-In button.

## Common Solutions

### Solution 1: Recreate OAuth Client ID

1. In Google Cloud Console, delete the existing OAuth 2.0 Client ID
2. In Firebase Console, go to Authentication > Sign-in method > Google
3. Disable Google Sign-In and save
4. Re-enable Google Sign-In
5. Firebase will automatically create a new OAuth client

### Solution 2: Add Authorized Domains

1. In Firebase Console, go to Authentication > Sign-in method
2. Scroll to **Authorized domains**
3. Add `localhost` and any other domains you're using

### Solution 3: Check Expo Configuration

Make sure your [app.json](file:///d:/StuddyBuddy/app.json) includes the correct scheme:

```json
{
  "expo": {
    "scheme": "yourscheme"
  }
}
```

## Testing Google Sign-In

1. Make sure you're using a real device or emulator (not just web)
2. Try with a different Google account
3. Ensure the Google account isn't already signed in to another session

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/authentication/#google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)