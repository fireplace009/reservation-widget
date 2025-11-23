// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBK0aDgQFjY59UkQlQkmKgttIrkm4NIiBg",
    authDomain: "reserveer-adebb.firebaseapp.com",
    projectId: "reserveer-adebb",
    storageBucket: "reserveer-adebb.firebasestorage.app",
    messagingSenderId: "454276966076",
    appId: "1:454276966076:web:922aa1be58c08dbfaed2b9",
    measurementId: "G-0VZN6BVP2H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);