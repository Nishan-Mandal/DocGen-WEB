// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyASatu0YuaLlj25WXlV7vobgRoxSDc7COU",
  authDomain: "docgen-api-94fbd.firebaseapp.com",
  projectId: "docgen-api-94fbd",
  storageBucket: "docgen-api-94fbd.firebasestorage.app",
  messagingSenderId: "746637463346",
  appId: "1:746637463346:web:922dc5749f2995f7a9112b",
  measurementId: "G-C95ZR6LE0Y"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

