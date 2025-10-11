# Google Sign-In Setup Guide

This guide will help you set up Google Sign-In for your Firebase project.

## Step 1: Enable Google Sign-In in Firebase Console

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** and enable it
5. Add your project's support email

## Step 2: Get Your OAuth Client IDs

### For Web:
1. In the Firebase Console, go to **Project Settings** (gear icon)
2. In the **General** tab, scroll down to **Your apps**
3. If you don't have a web app configured, click **Add app** and select the web icon
4. Register your app and note the **Web client ID** (it looks like `XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`)

### For iOS:
1. In the Firebase Console, go to **Project Settings**
2. In the **General** tab, scroll down to **Your apps**
3. If you don't have an iOS app configured, click **Add app** and select the iOS icon
4. Register your app and download the `GoogleService-Info.plist` file
5. Note the **iOS client ID**

### For Android:
1. In the Firebase Console, go to **Project Settings**
2. In the **General** tab, scroll down to **Your apps**
3. If you don't have an Android app configured, click **Add app** and select the Android icon
4. Register your app and download the `google-services.json` file
5. Note the **Android client ID**

## Step 3: Update Your Environment Variables

Update the values in your `.env` file with the actual client IDs:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_actual_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_actual_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_actual_android_client_id.apps.googleusercontent.com
```

## Step 4: Update app.json (Alternative to .env)

Alternatively, you can update the values in your `app.json` file:

```json
"extra": {
  "EXPO_PUBLIC_GEMINI_API_KEY": "AIzaSyDtbcAlT4Hq0KrvbsLDVc8l5woyXKOn5KA",
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your_actual_web_client_id.apps.googleusercontent.com",
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your_actual_ios_client_id.apps.googleusercontent.com",
  "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your_actual_android_client_id.apps.googleusercontent.com"
}
```

## Step 5: Test Google Sign-In

1. Restart your development server
2. Navigate to the sign-in page
3. Click the "Sign in with Google" button
4. You should now be able to authenticate with your Google account

## Troubleshooting

If you're still having issues:

1. Make sure you've enabled Google Sign-In in the Firebase Console
2. Verify that your client IDs are correct
3. Check that your Firebase project is properly configured
4. Ensure you've added your domain to the authorized domains list in the Google Cloud Console

## Additional Notes

- For development, you can use `localhost` as an authorized domain
- For production, make sure to add your production domain to the authorized domains list
- The Google Sign-In flow will open a browser window for authentication and then return to your app