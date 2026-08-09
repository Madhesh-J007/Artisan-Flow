import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. Go to https://console.firebase.google.com → Add project (free tier is fine)
// 2. In your new project: Build → Authentication → Get started → Sign-in method →
//    enable "Email/Password"
// 3. Build → Firestore Database → Create database → Start in TEST MODE
//    (fine for a hackathon demo; lock down rules before any real launch)
// 4. Project settings (gear icon) → General → scroll to "Your apps" →
//    click the web icon (</>) → register an app → copy the config object below.

const firebaseConfig = {
  apiKey: "AIzaSyAjJRHBeZNuWfaFRxcchFvjRNIgIjnenlg",
  authDomain: "artisian-flow.firebaseapp.com",
  projectId: "artisian-flow",
  storageBucket: "artisian-flow.firebasestorage.app",
  messagingSenderId: "395656713680",
  appId: "1:395656713680:web:2ae6de6722f910c74515d5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
