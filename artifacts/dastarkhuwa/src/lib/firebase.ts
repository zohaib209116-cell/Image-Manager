import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdSnwi5inR0SimAZpXz3w2sBmIle4vO9U",
  authDomain: "restaurant-reservation-s-4f34f.firebaseapp.com",
  projectId: "restaurant-reservation-s-4f34f",
  storageBucket: "restaurant-reservation-s-4f34f.firebasestorage.app",
  messagingSenderId: "776012870152",
  appId: "1:776012870152:web:f39a33e800d9df7a6157bd"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
