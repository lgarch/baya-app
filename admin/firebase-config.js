import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: REMPLACEZ CES VALEURS PAR VOS CLÉS FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCgIWLEGGa5pfI6N0nJNM8LBk4Q8TbbPHY",
  authDomain: "staymaroc-20741.firebaseapp.com",
  projectId: "staymaroc-20741",
  storageBucket: "staymaroc-20741.firebasestorage.app",
  messagingSenderId: "390727343799",
  appId: "1:390727343799:web:7dbd740a70166c8ce1f732"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
