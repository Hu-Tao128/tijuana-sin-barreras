import { firebase } from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDg5o-XQPbRxrZU8fYGWgcoSsfAiXrnb2k",
  authDomain: "tijuana-sin-barreras.firebaseapp.com",
  projectId: "tijuana-sin-barreras",
  storageBucket: "tijuana-sin-barreras.firebasestorage.app",
  messagingSenderId: "357899360076",
  appId: "1:357899360076:web:7caee8289c0f002ceea1e9",
  measurementId: "G-MRTTEYKJ3L"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase };
