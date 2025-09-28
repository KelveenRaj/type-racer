import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5KKlOyFZRcCC1qSkf3VQdEv1ap5YU8b8",
  authDomain: "type-racer-b8041.firebaseapp.com",
  databaseURL:
    "https://type-racer-b8041-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "type-racer-b8041",
  storageBucket: "type-racer-b8041.firebasestorage.app",
  messagingSenderId: "112254628895",
  appId: "1:112254628895:web:5bb16fbe79b96d6101912a",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
