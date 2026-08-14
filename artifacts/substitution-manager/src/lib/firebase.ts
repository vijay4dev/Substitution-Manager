import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADAIrOnBELTP54xIANdB25d2aqSfwOmM0",
  authDomain: "substitutionappmskis.firebaseapp.com",
  projectId: "substitutionappmskis",
  storageBucket: "substitutionappmskis.firebasestorage.app",
  messagingSenderId: "1017486824403",
  appId: "1:1017486824403:web:20907fdd78eb52d58c5526"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
