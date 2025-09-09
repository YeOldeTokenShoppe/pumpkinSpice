# Firebase Realtime Database Setup for Moon Room Chat

## Quick Setup Steps

### 1. Enable Realtime Database in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **hailmary-3ff6c**
3. In the left sidebar, click **Realtime Database**
4. Click **Create Database**
5. Choose your database location (select the closest to your users)
6. When asked about security rules, select **Start in test mode** for now

### 2. Set Up Database Rules

For **testing** (allows all read/write - use temporarily):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For **production** (more secure):

```json
{
  "rules": {
    "moonRoom": {
      "chat": {
        ".read": true,
        ".write": true,
        "$messageId": {
          ".validate": "newData.hasChildren(['from', 'message', 'timestamp', 'address'])"
        }
      },
      "members": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 3. How to Apply Rules

1. In Firebase Console, go to **Realtime Database**
2. Click on the **Rules** tab
3. Replace the existing rules with one of the above
4. Click **Publish**

### 4. Verify Your Database URL

Your database URL should be:
```
https://hailmary-3ff6c-default-rtdb.firebaseio.com
```

This is already configured in your `moonroom-config.js` file.

## Testing the Chat

Once the database is enabled and rules are set:

1. Open `/MoonRoom.html` in your browser
2. Open the browser console (F12)
3. You should see:
   - "Firebase initialized successfully"
   - "✅ Connected to Firebase Realtime Database"
   - "Generated test user: ..." (with your test user info)
   - "Initializing chat listeners..."

4. Try sending a message - you should see console logs showing the message being sent

## Troubleshooting

### If messages aren't sending:

1. **Check the console for errors** - Look for specific Firebase error messages
2. **Verify database is enabled** - The Realtime Database must be activated in Firebase Console
3. **Check the rules** - Start with test rules (`.read: true, .write: true`) to ensure it's not a permissions issue
4. **Verify the database URL** - Make sure it matches your Firebase project

### Common Issues:

- **"Permission denied"** - Database rules are too restrictive. Use test rules temporarily
- **"Firebase is not defined"** - The Firebase scripts aren't loading. Check network tab
- **"Database not initialized"** - Firebase initialization failed. Check your config

## Database Structure

The chat creates this structure in your Realtime Database:

```
moonRoom/
  ├── chat/
  │   ├── [messageId]/
  │   │   ├── from: "ILLUMIN80 #42"
  │   │   ├── message: "Hello Moon Room!"
  │   │   ├── timestamp: 1234567890
  │   │   └── address: "moon_abc123"
  │   └── ...
  └── members/
      ├── [userAddress]/
      │   ├── address: "moon_abc123"
      │   ├── nickname: "ILLUMIN80 #42"
      │   └── joinedAt: 1234567890
      └── ...
```

## Next Steps

After testing is working:

1. Integrate with your actual wallet authentication
2. Replace test rules with production rules
3. Add member verification (only ILLUMIN80 holders)
4. Consider adding:
   - Message moderation
   - Rate limiting
   - User blocking
   - Message reactions
   - File/image sharing