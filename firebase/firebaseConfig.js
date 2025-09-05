// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBpxU1DAr0CrODwPhOwWDkk7uzjcRnP8I",
  authDomain: "rnsb-3261a.firebaseapp.com",
  projectId: "rnsb-3261a",
  storageBucket: "rnsb-3261a.firebasestorage.app",
  messagingSenderId: "234882778415",
  appId: "1:234882778415:web:4675b5dd71f562ebfbcdda",
  measurementId: "G-CPK7F60HQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;