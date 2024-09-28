// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Certifique-se de importar o Firestore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa o AsyncStorage para persistência

// Sua configuração do Firebase
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

// Inicializa o Auth com persistência usando AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage), // Configura o Firebase Auth para persistência com AsyncStorage
});

// Instância do Firestore
export const db = getFirestore(app); // Exporta o Firestore
