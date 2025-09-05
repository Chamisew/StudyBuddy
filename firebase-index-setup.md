# Firebase Index Setup Guide

## Required Firebase Firestore Index

To resolve the Firebase index error, you need to create a composite index in your Firebase console.

### Steps to Create the Index:

1. **Open Firebase Console**: Go to https://console.firebase.google.com
2. **Select Your Project**: Click on your project (rnsb-3261a)
3. **Navigate to Firestore Database**: Click on "Firestore Database" in the left sidebar
4. **Go to Indexes Tab**: Click on the "Indexes" tab
5. **Create Composite Index**: Click "Create Index"

### Index Configuration:

**Collection ID**: `customGames`

**Fields to Index**:
1. Field: `isActive` | Type: `Ascending`
2. Field: `createdAt` | Type: `Descending`

### Alternative Solution (Already Implemented)

I've modified the code to avoid the index requirement by:
- Removing the `orderBy('createdAt', 'desc')` from the query
- Sorting the results client-side instead

This eliminates the need for the composite index while maintaining the same functionality.

## Additional Notes

- The modified query will work immediately without requiring any Firebase configuration changes
- Client-side sorting is acceptable for small datasets (limit 10)
- If you prefer server-side sorting, create the index as described above and revert the query changes

## Code Changes Made

The `loadCustomGames` function in `escape-room.js` has been updated to:
- Use a simpler query without `orderBy`
- Sort results client-side by `createdAt`
- Handle potential null/undefined `createdAt` values safely