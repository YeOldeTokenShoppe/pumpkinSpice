// Firebase initialization for server-side API routes
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  orderBy,
  limit as limitFn,
  writeBatch,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase for server-side use
let app;
let db;

try {
  // Check if we have the required environment variables
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing required Firebase environment variables");
  } else {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.log("Firebase initialized successfully for server");
  }
} catch (error) {
  console.error("Error initializing Firebase on server:", error);
}

// Export the initialized Firebase services
export { db, app };

// Export Firebase functions
export { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc, 
  orderBy, 
  limitFn as limit, 
  writeBatch, 
  serverTimestamp, 
  getDoc, 
  setDoc,
};