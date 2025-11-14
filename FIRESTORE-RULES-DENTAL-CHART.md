# Firestore Security Rules for Dental Chart

## Overview
This document describes the security rules needed to protect the new `dentalCharts` collection in Firestore.

## Rules Addition

Add the following rules to your `firestore.rules` file in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Check if user has access to clinic
    function hasClinicAccess(clinicId) {
      let userConfig = get(/databases/$(database)/documents/userConfig/$(request.auth.uid)).data;
      return request.auth != null && (
        userConfig.role == 'boss' ||
        userConfig.role == 'owner' ||
        clinicId in userConfig.assignedLocations
      );
    }

    // ==================== DENTAL CHARTS COLLECTION ====================
    match /dentalCharts/{userId} {
      // Read: User must be authenticated and have clinic access
      allow read: if request.auth != null &&
        hasClinicAccess(resource.data.clinicLocation);

      // Create: User must be authenticated and have clinic access
      allow create: if request.auth != null &&
        hasClinicAccess(request.resource.data.clinicLocation) &&
        // Validate required fields
        request.resource.data.keys().hasAll(['userId', 'patientName', 'teeth', 'lastUpdated']);

      // Update: User must be authenticated and have clinic access
      allow update: if request.auth != null &&
        hasClinicAccess(resource.data.clinicLocation) &&
        // Prevent changing userId
        request.resource.data.userId == resource.data.userId &&
        // Limit document size to prevent abuse
        request.resource.size() < 5000000; // 5MB for dental charts with attachments

      // Delete: Only boss/owner can delete
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/userConfig/$(request.auth.uid)).data.role in ['boss', 'owner'];
    }

    // ... existing rules for other collections ...
  }
}
```

## Implementation Steps

1. **Go to Firebase Console**:
   - Navigate to your Firebase project
   - Go to Firestore Database → Rules tab

2. **Update the rules**:
   - Copy the rules above
   - Replace or add them to your existing rules
   - Make sure the helper function `hasClinicAccess` is available
   - If you don't have a `userConfig` collection, adapt the rules accordingly

3. **Publish the rules**:
   - Click "Publish" button
   - Wait for rules to deploy (usually 1-2 minutes)

4. **Test the rules**:
   - Use Firebase Emulator Suite (optional but recommended)
   - Verify permissions work correctly before deploying to production

## Rule Breakdown

### Read Access
- ✅ Authenticated users only
- ✅ Must have access to the clinic that owns the chart
- ✅ Can read their own or subordinate clinics' data (based on role)

### Create Access
- ✅ Authenticated users only
- ✅ Must have clinic access
- ✅ Required fields: userId, patientName, teeth, lastUpdated
- ❌ Cannot create without proper authorization

### Update Access
- ✅ Authenticated users only
- ✅ Must have clinic access
- ✅ Cannot change userId (prevents data reassignment)
- ✅ Size limit: 5MB (for images and attachments)
- ❌ Cannot update if clinic access denied

### Delete Access
- ✅ Only boss/owner role can delete
- ❌ Regular admins cannot delete charts

## Important Notes

1. **clinicLocation field**: The rules check `resource.data.clinicLocation`. Make sure your dental chart documents include this field with the clinic identifier (e.g., 'arcadia', 'irvine', etc.)

2. **userConfig structure**: The rules assume a `userConfig` collection with user role and clinic access info. If your structure is different, adapt accordingly.

3. **Custom Claims alternative**: For additional security, consider using Firebase Custom Claims instead of storing role/clinic info in Firestore.

4. **Testing**: Always test rules in a safe environment before deploying to production.

## Migration Guide

If you're adding dental charts to an existing system:

1. Update Firestore rules to include dental chart permissions
2. Initialize dental charts for existing patients (can be done via Cloud Function)
3. Test thoroughly before releasing to users
4. Keep old rules as backup in case of rollback

## Troubleshooting

### "Permission Denied" errors
- Check that user is authenticated
- Verify user has access to the clinic
- Check userConfig collection has correct role and clinicLocation data

### Rules not applying
- Wait for rules to publish (check Firebase Console)
- Clear browser cache and refresh
- Try in incognito mode to bypass local caching

### Size limit errors
- Consider archiving old dental chart data to a separate collection
- Implement pagination for large treatment histories
- Use Cloud Storage for very large files instead of Firestore

## See Also
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage Rules](https://firebase.google.com/docs/storage/security/rules)
