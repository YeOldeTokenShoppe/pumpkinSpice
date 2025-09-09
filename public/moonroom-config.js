// Moon Room Firebase Configuration
// These values are pulled from your environment variables
const MOONROOM_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCTfNk-F92lXgcyvpu1FILXCFzZMn-ABs0",
  authDomain: "hailmary-3ff6c.firebaseapp.com",
  databaseURL: "https://hailmary-3ff6c-default-rtdb.firebaseio.com",
  projectId: "hailmary-3ff6c",
  storageBucket: "hailmary-3ff6c.firebasestorage.app",
  messagingSenderId: "454753598575",
  appId: "1:454753598575:web:296da6b6e30c80b179219a"
};

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOONROOM_FIREBASE_CONFIG;
}