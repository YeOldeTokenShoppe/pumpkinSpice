# Moon Room Chat Feature Setup

## Overview
The Moon Room chat feature has been successfully integrated into your moonroom.html page. This provides a real-time chat experience for your ILLUMIN80 members using Firebase Realtime Database.

## Features Implemented
- Real-time messaging with Firebase Realtime Database
- Online members list showing who's currently in the Moon Room
- Automatic user identification using wallet address and member ranking
- Clean, glassmorphic UI that matches the Moon Room aesthetic
- Collapsible/minimizable chat interface
- Message history (last 50 messages)
- Automatic cleanup of old messages
- Mobile responsive design

## Setup Instructions

### 1. Firebase Configuration
The chat feature requires Firebase Realtime Database. If you haven't already:

1. Go to your Firebase Console (https://console.firebase.google.com)
2. Enable **Realtime Database** in your project
3. Set up the following database rules for security:

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

### 2. Update Firebase Configuration
The Firebase configuration is already set up to use your environment variables. Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Wallet Integration
The chat currently uses localStorage for user identification. To integrate with your actual wallet authentication:

1. When a user connects their wallet, store their address:
```javascript
localStorage.setItem('walletAddress', userWalletAddress);
localStorage.setItem('memberRanking', userRanking); // Their ILLUMIN80 ranking
```

2. The chat will automatically pick up these values and use them for user identification.

## File Structure
- `/public/MoonRoom.html` - Main Moon Room page with integrated chat
- `/public/moonroom-config.js` - Firebase configuration file
- `/src/utilities/firebaseClient.js` - Updated with Realtime Database support

## UI Features
- **Chat Container**: Fixed position in bottom-right corner
- **Minimize/Maximize**: Click the minus/plus button to toggle
- **Send Messages**: Type and press Enter or click Send
- **Online Members**: Shows real-time list of connected members
- **Message History**: Displays last 50 messages with timestamps

## Customization Options

### Styling
The chat uses a glassmorphic design with these main colors:
- Background: `rgba(26, 26, 58, 0.95)` (dark blue)
- Text: `#faf0e6` (moon white)
- Accent: Purple gradient for send button
- Online indicator: `#4ade80` (green)

You can modify these in the `<style>` section of MoonRoom.html.

### Chat Behavior
- Message limit: Currently 50 messages (line 127 in chat script)
- Cleanup interval: 60 seconds (line 283 in chat script)
- Member display format: "ILLUMIN80 #[ranking]" (line 148 in chat script)

## Testing
For testing without wallet connection, the chat will automatically generate a test user. This can be disabled by removing the test user generation code (lines 126-131 in the chat script).

## Security Considerations
1. Add proper Firebase security rules based on your authentication system
2. Validate user wallet addresses before allowing chat access
3. Consider adding rate limiting for messages
4. Implement content moderation if needed

## Mobile Support
The chat is fully responsive and will:
- Expand to full width on mobile devices
- Hide the members list on small screens
- Adjust height for better mobile viewing

## Next Steps
1. Integrate with your actual wallet authentication system
2. Add member verification to ensure only ILLUMIN80 holders can access
3. Consider adding features like:
   - Emoji support
   - Image sharing
   - Private messaging
   - Typing indicators
   - Read receipts

## Support
The chat feature is now ready to use. Once you update the Firebase configuration with your actual credentials, the chat will be fully functional!