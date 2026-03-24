import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDmbd4igjIeWks_oLqjZApLvaqY9U7lGLc',
  authDomain: 'blink-naming.firebaseapp.com',
  projectId: 'blink-naming',
  storageBucket: 'blink-naming.firebasestorage.app',
  messagingSenderId: '225502078859',
  appId: '1:225502078859:web:6fe83581660731229cb18e',
  measurementId: 'G-2HSJG8S6SC'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
