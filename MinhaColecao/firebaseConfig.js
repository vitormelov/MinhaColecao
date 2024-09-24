// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Certifique-se de importar o Firestore
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYOZjiPUiqy_BDuzhak8ke_E8TwygfKCw",
  authDomain: "minhacolecao-65290.firebaseapp.com",
  projectId: "minhacolecao-65290",
  storageBucket: "minhacolecao-65290.appspot.com",
  messagingSenderId: "227616727093",
  appId: "1:227616727093:web:ff756064d46e3c2093d17c",
  measurementId: "G-91LC4LK578"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore e o Auth
export const auth = getAuth(app);
export const db = getFirestore(app); // Instância correta do Firestore