import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzONhsAFVtnP5r3_-WcAn1vu-QCbOcgJw",
  authDomain: "ncet-mock.firebaseapp.com",
  projectId: "ncet-mock",
  storageBucket: "ncet-mock.firebasestorage.app",
  messagingSenderId: "494333647683",
  appId: "1:494333647683:web:06da7d2d284ca40df32df6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
