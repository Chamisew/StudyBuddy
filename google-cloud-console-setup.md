# Google Cloud Console Setup for Google Sign-In

## Prerequisites

You already have your Web Client ID: `234882778415-qo2oe5ehans3gpajht9dl4mljqodjq1r.apps.googleusercontent.com`

## Step-by-Step Configuration

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (rnsb-3261a)

### 2. Navigate to OAuth Client IDs

1. In the left sidebar, click "APIs & Services"
2. Click "Credentials"
3. Find your OAuth 2.0 Client ID with the name that includes "web client" or similar

### 3. Edit OAuth Client ID

1. Click the pencil icon next to your OAuth 2.0 Client ID
2. Scroll down to "Authorized redirect URIs"

### 4. Add Required Redirect URIs

Add these URIs to the "Authorized redirect URIs" section:

```
https://auth.expo.io/@anonymous/my-firebase-app
http://localhost:19006
http://localhost:8081/signin
```

Note: If you have a different Expo username or project name, adjust the first URI accordingly:
`https://auth.expo.io/@your-username/your-project-slug`

### 5. Save Changes

Click "Save" at the bottom of the form

## Verification Steps

### 1. Check Client ID Type

Make sure your OAuth client is of type "Web application"

### 2. Verify Authorized Domains

In Firebase Console:
1. Go to Authentication > Sign-in method
2. Scroll to "Authorized domains"
3. Ensure `localhost` is listed

### 3. Test Configuration

1. Restart your development server
2. Clear Expo cache: `npx expo start -c`
3. Try Google Sign-In on a device or simulator

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch" Error

**Solution**: Make sure all required redirect URIs are added to your OAuth client configuration

### Issue: Client ID Shows as "Other" Type

**Solution**: You may need to create a new OAuth client of type "Web application"

### Issue: Still Getting Dismissed Authentication

**Solution**: 
1. Try on a physical device with Expo Go app
2. Ensure you're not using incognito/private browsing mode
3. Check that your Google account isn't already signed in to another session

## Additional Notes

- Changes in Google Cloud Console may take a few minutes to propagate
- Make sure you're using the correct project in Google Cloud Console
- The OAuth client should be associated with your Firebase project

## Troubleshooting

If you're still having issues:

1. Delete the existing OAuth client
2. In Firebase Console, disable and re-enable Google Sign-In
3. Firebase will automatically create a new OAuth client with correct configuration
4. Update your environment variables with the new client ID if it changes