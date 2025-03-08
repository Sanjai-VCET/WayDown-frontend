// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD9vjyz0m4pJ8-UUKKabuQjTrLyQNil400",
  authDomain: "waydown-dbd87.firebaseapp.com",
  projectId: "waydown-dbd87",
  storageBucket: "waydown-dbd87.firebasestorage.app",
  messagingSenderId: "843162942125",
  appId: "1:843162942125:web:2461ba79668ae671622424",
  measurementId: "G-6FDN7QL4WV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);