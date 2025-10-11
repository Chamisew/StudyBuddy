# Google Sign-In Dismiss Issue Troubleshooting

## Problem Description

When clicking the "Sign in with Google" button, the authentication flow starts but then gets dismissed immediately, preventing successful authentication. The console shows:
```
Google Auth response: {type: 'dismiss'}
```

## Common Causes

1. **Running on Web**: Google Sign-In with `expo-auth-session` works best on devices/simulators, not web browsers
2. **Missing Redirect URI Configuration**: The redirect URI isn't properly configured in Google Cloud Console
3. **Incorrect Client ID**: The OAuth client ID doesn't match what's registered in Google Cloud Console
4. **Expo Auth Proxy Issues**: The Expo authentication proxy isn't working correctly

## Solutions

### Solution 1: Use Device/Simulator Instead of Web

Google Sign-In works best on actual devices or simulators:

1. Install the Expo Go app on your phone
2. Run your app with `npx expo start`
3. Scan the QR code with your phone to open the app in Expo Go
4. Try Google Sign-In again

### Solution 2: Configure Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (rnsb-3261a)
3. Navigate to APIs & Services > Credentials
4. Click on your OAuth 2.0 Client ID (should contain `234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r`)
5. Add the following URIs to "Authorized redirect URIs":
   - `https://auth.expo.io/@anonymous/my-firebase-app`
   - `http://localhost:19006`
   - `http://localhost:8081/signin`
6. Click "Save"

### Solution 3: Verify Client ID

1. Make sure the client ID in your [.env](file:///d:/StuddyBuddy/.env) file matches what's in Google Cloud Console
2. The client ID should look like: `XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`

### Solution 4: Enable Expo Auth Proxy

In your Google authentication configuration, make sure you're using the proxy:

```javascript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  useProxy: true, // This helps with compatibility
});
```

### Solution 5: Add Platform-Specific Client IDs

Make sure you have client IDs for all platforms you're targeting:

```javascript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  useProxy: true,
});
```

## Testing Steps

1. **Check if request is available**:
   ```javascript
   useEffect(() => {
     console.log('Google Auth request:', request);
   }, [request]);
   ```

2. **Verify environment variables**:
   ```javascript
   console.log('Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
   ```

3. **Test on device**:
   - Use Expo Go app on your phone
   - Don't use web browser for testing Google Sign-In

## Additional Debugging

Add this to your component to get more information:

```javascript
useEffect(() => {
  console.log('Component mounted');
  console.log('Request available:', !!request);
  console.log('Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
}, []);
```

## Common Mistakes to Avoid

1. **Testing on web only**: Google Sign-In often fails on web but works on devices
2. **Using wrong client ID**: Web client ID is different from iOS/Android client IDs
3. **Missing redirect URIs**: Google requires specific redirect URIs to be registered
4. **Not restarting development server**: Changes to environment variables require a server restart

## If Nothing Works

1. Refer to [COMPREHENSIVE_GOOGLE_AUTH_FIX.md](file:///d:/StuddyBuddy/COMPREHENSIVE_GOOGLE_AUTH_FIX.md) for a complete troubleshooting guide
2. Delete your OAuth client in Google Cloud Console
3. Disable and re-enable Google Sign-In in Firebase Console
4. Firebase will automatically create a new OAuth client with correct configuration
5. Update your environment variables with the new client ID