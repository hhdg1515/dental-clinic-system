# Firebase Custom Claims Setup Guide

## 🎯 What You Need To Do

Your code is now ready to use **Firebase Custom Claims** for secure role-based authorization. However, you need to configure Firebase to set these claims on your users.

## 🔒 Why This Is Important

**BEFORE:** Anyone could bypass authorization by modifying localStorage:
```javascript
// Attacker in browser console:
localStorage.setItem('currentUser', JSON.stringify({role: 'owner'}));
// → Now sees owner UI (but Firestore Rules still block real access)
```

**AFTER:** Role comes from Firebase ID Token (server-verified):
```javascript
// Code now reads from Firebase token claims (cannot be manipulated)
const claims = await user.getIdTokenResult();
const role = claims.claims.role; // Set by Firebase Admin SDK
```

## 📋 Current Status

✅ **Client Code Updated** - Your app now reads roles from Firebase tokens
⚠️ **Custom Claims NOT Set** - You need to configure Firebase to add claims to user tokens

**Fallback Behavior:**
- If no custom claims are set, users with `@firstavedental.com` emails will be treated as owners
- Other users will have `customer` role by default

## 🛠️ Setup Options

You have **4 options** to set custom claims. Choose the one that fits your needs:

---

### Option 1: Firebase CLI (Quickest for Testing) ⚡

**Best for:** Quick testing, small number of users

**Steps:**

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Set claims for a user:**
   ```bash
   # For owner/boss
   firebase auth:set-custom-claims user@firstavedental.com --claims '{"role":"owner","clinics":["arcadia","irvine","south-pasadena","rowland-heights","eastvale"]}'

   # For admin with specific clinics
   firebase auth:set-custom-claims admin@example.com --claims '{"role":"admin","clinics":["arcadia","irvine"]}'

   # For regular customer
   firebase auth:set-custom-claims customer@example.com --claims '{"role":"customer"}'
   ```

3. **User must sign out and sign back in** for new claims to take effect

**Pros:** ✅ Fastest  ✅ No coding required
**Cons:** ❌ Manual process  ❌ Doesn't scale

---

### Option 2: Cloud Function (Automatic on User Creation) 🔥

**Best for:** Production use, automatic role assignment

**Steps:**

1. **Install Firebase Functions:**
   ```bash
   firebase init functions
   cd functions
   npm install
   ```

2. **Create `functions/index.js`:**
   ```javascript
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   admin.initializeApp();

   // Automatically set role when user signs up
   exports.processSignUp = functions.auth.user().onCreate(async (user) => {
     const email = user.email;

     // Determine role based on email
     let role = 'customer';
     let clinics = [];

     if (email && email.endsWith('@firstavedental.com')) {
       role = 'owner';
       clinics = ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'];
     }

     // Set custom claims
     try {
       await admin.auth().setCustomUserClaims(user.uid, {
         role: role,
         clinics: clinics
       });

       console.log(`✅ Set role '${role}' for user ${email}`);
     } catch (error) {
       console.error('❌ Error setting custom claims:', error);
     }
   });

   // Function to manually update user role (call via HTTP)
   exports.setUserRole = functions.https.onCall(async (data, context) => {
     // Only allow owner to set roles
     if (!context.auth || !context.auth.token.role || context.auth.token.role !== 'owner') {
       throw new functions.https.HttpsError('permission-denied', 'Only owners can set user roles');
     }

     const { uid, role, clinics } = data;

     await admin.auth().setCustomUserClaims(uid, {
       role: role,
       clinics: clinics || []
     });

     return { success: true, message: `Role updated to ${role}` };
   });
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only functions
   ```

4. **Existing users:** Use Option 1 (CLI) to set claims, or have them sign out/in to trigger the function

**Pros:** ✅ Automatic  ✅ Production-ready  ✅ Scalable
**Cons:** ❌ Requires deployment  ❌ Costs money (Firebase Blaze plan)

---

### Option 3: Firebase Extensions (Easiest, No Code) 🧩

**Best for:** No coding, visual interface

**Steps:**

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/
   - Select your project

2. **Install Extension:**
   - Go to **Build > Extensions**
   - Click **Install Extension**
   - Search for "Trigger Email"
   - Or use **Custom User Claims** extension (if available)

3. **Configure Extension:**
   - Set rules for email domains → roles
   - Example: `@firstavedental.com` → `{role: 'owner'}`

**Pros:** ✅ No coding  ✅ Visual interface
**Cons:** ❌ Limited flexibility  ❌ May not have exact extension you need

---

### Option 4: Node.js Script (One-Time Bulk Update) 📝

**Best for:** Setting claims for existing users in bulk

**Steps:**

1. **Create `set-user-claims.js`:**
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./path/to/serviceAccountKey.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   async function setUserClaims(email, role, clinics = []) {
     try {
       const user = await admin.auth().getUserByEmail(email);
       await admin.auth().setCustomUserClaims(user.uid, {
         role: role,
         clinics: clinics
       });
       console.log(`✅ Set role '${role}' for ${email}`);
     } catch (error) {
       console.error(`❌ Error for ${email}:`, error.message);
     }
   }

   // Set claims for all your users
   async function main() {
     await setUserClaims('owner@firstavedental.com', 'owner', [
       'arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'
     ]);

     await setUserClaims('admin1@example.com', 'admin', ['arcadia', 'irvine']);
     await setUserClaims('admin2@example.com', 'admin', ['south-pasadena']);
     await setUserClaims('customer@example.com', 'customer', []);

     console.log('✅ All claims set!');
     process.exit(0);
   }

   main();
   ```

2. **Get Service Account Key:**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json`
   - **⚠️ NEVER commit this file to Git!**

3. **Run:**
   ```bash
   npm install firebase-admin
   node set-user-claims.js
   ```

**Pros:** ✅ Bulk updates  ✅ Full control
**Cons:** ❌ Need service account key  ❌ Manual script

---

## 🔍 How to Verify Claims Are Set

### Method 1: Check in Browser Console

After signing in, open browser console and run:
```javascript
firebase.auth().currentUser.getIdTokenResult()
  .then(result => {
    console.log('Custom claims:', result.claims);
    console.log('Role:', result.claims.role);
    console.log('Clinics:', result.claims.clinics);
  });
```

### Method 2: Check Firebase Console

1. Go to **Authentication > Users**
2. Click on a user
3. Scroll to "Custom claims"

---

## 📊 Custom Claims Structure

Your app expects this structure:

```javascript
{
  "role": "owner" | "admin" | "customer",
  "clinics": ["arcadia", "irvine", ...]  // Only for admin/owner
}
```

### Examples:

**Owner:**
```json
{
  "role": "owner",
  "clinics": ["arcadia", "irvine", "south-pasadena", "rowland-heights", "eastvale"]
}
```

**Admin (limited clinics):**
```json
{
  "role": "admin",
  "clinics": ["arcadia", "irvine"]
}
```

**Customer:**
```json
{
  "role": "customer",
  "clinics": []
}
```

---

## ⚠️ Important Notes

1. **Users must sign out and sign back in** after claims are set/updated
2. **Claims are cached** - refresh token to get latest:
   ```javascript
   await firebase.auth().currentUser.getIdToken(true); // force refresh
   ```
3. **@firstavedental.com fallback** - Even without claims, these emails get owner access
4. **Firestore Rules updated** - Your rules now check both email domain AND custom claims

---

## 🎯 Recommended Approach

**For immediate testing:** Use Option 1 (CLI)
**For production:** Use Option 2 (Cloud Functions)

---

## 🆘 Troubleshooting

### "Role is undefined"
- Claims not set yet → Use one of the 4 options above
- User hasn't signed out/in → Tell user to logout and login again
- Token not refreshed → Call `getIdToken(true)` to force refresh

### "Permission denied" errors
- Check Firestore Rules allow the operation
- Verify claims are set correctly (`console.log(result.claims)`)
- Make sure user email matches expected domain

### "Function not found"
- Cloud Functions not deployed → Run `firebase deploy --only functions`
- Function name mismatch → Check function name in code and when calling

---

## 📖 Further Reading

- [Firebase Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
