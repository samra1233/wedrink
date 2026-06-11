import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAakFasuwjBerQkZu6KVMzH1SE-c_F8qK0",
  authDomain: "wedrink-2bf78.firebaseapp.com",
  projectId: "wedrink-2bf78",
  storageBucket: "wedrink-2bf78.firebasestorage.app",
  messagingSenderId: "197930332464",
  appId: "1:197930332464:web:7140973f02afa3a4c9d8f5",
  measurementId: "G-7CP4RE82Y6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
