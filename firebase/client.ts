// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjxaxK8WcMcuCBSw-A4tRzvQ7QkE6m36w",
  authDomain: "ageno-quiz-af3ff.firebaseapp.com",
  projectId: "ageno-quiz-af3ff",
  storageBucket: "ageno-quiz-af3ff.firebasestorage.app",
  messagingSenderId: "1007620282652",
  appId: "1:1007620282652:web:aec978610e1c01334102d9",
  measurementId: "G-8WYX4Y66NY",
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
