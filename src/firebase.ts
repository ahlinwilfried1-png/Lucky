import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ornate-signal-p6d0h",
  appId: "1:1019221319580:web:de9f052f2401fbe6167259",
  apiKey: "AIzaSyDL2GhfjupR1sk1_7LilbGixrhlDmWjB-I",
  authDomain: "ornate-signal-p6d0h.firebaseapp.com",
  storageBucket: "ornate-signal-p6d0h.firebasestorage.app",
  messagingSenderId: "1019221319580"
};

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if applicable, otherwise use default
export const db = getFirestore(app, "ai-studio-8f483431-6360-4349-88a1-fc50f2293b4d");

export { app };
