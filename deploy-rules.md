# Deploy Firebase Rules

## Step 1: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Step 2: Deploy Storage Rules
```bash
firebase deploy --only storage
```

## Alternative: Manual Deployment

### Firestore Rules:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** > **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste and click **Publish**

### Storage Rules:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Storage** > **Rules**
4. Copy the contents of `firebase-storage-rules.txt` file
5. Paste and click **Publish**

## Test Commands:
```bash
# Check current Firestore rules
firebase firestore:rules:get

# Check current Storage rules
firebase storage:rules:get
```
