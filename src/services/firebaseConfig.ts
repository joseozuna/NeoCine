// src/services/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDEVQ98Au-nDd3j_-X8fpZSHjorKL4Q89A",
  authDomain: "loginreact-81588.firebaseapp.com",
  databaseURL: "https://loginreact-81588-default-rtdb.firebaseio.com",
  projectId: "loginreact-81588",
  storageBucket: "loginreact-81588.firebasestorage.app",
  messagingSenderId: "459998593411",
  appId: "1:459998593411:web:62da3e3f0723639ba076b6",
  measurementId: "G-TXMHY6P9R3"
};

// Inicializa la app y el módulo de Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
