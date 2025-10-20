// firebase-config.js
// GANTI SEMUA INI DENGAN KUNCI PROYEK FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR_API_KEY",
  authDomain: "xycloud-....firebaseapp.com",
  projectId: "xycloud-....",
  storageBucket: "xycloud-....appspot.com",
  messagingSenderId: "...",
  appId: "1:....:web:..."
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Aktifkan functions