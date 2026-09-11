// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwf_rpR1HwN6EKnZNcd4vQZc-8bAtXigw",
  authDomain: "fir-hrithik-5739c.firebaseapp.com",
  projectId: "fir-hrithik-5739c",
  storageBucket: "fir-hrithik-5739c.firebasestorage.app",
  messagingSenderId: "628729743921",
  appId: "1:628729743921:web:f6de62c95406154025e310",
  measurementId: "G-QDVE4C1EFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export them so you can use them anywhere in your app
export { app, analytics, auth, db };