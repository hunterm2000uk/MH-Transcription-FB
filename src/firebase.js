import { initializeApp } from 'firebase/app';
    import { getFirestore } from 'firebase/firestore';

    const firebaseConfig = {
  apiKey: "AIzaSyDRbT84sb0KzhWQ_E0ZdnRePqUSJIPd11o",
  authDomain: "transcription02-1ec48.firebaseapp.com",
  projectId: "transcription02-1ec48",
  storageBucket: "transcription02-1ec48.firebasestorage.app",
  messagingSenderId: "199887597836",
  appId: "1:199887597836:web:bbef0137a7ba4866a2d929",
  measurementId: "G-Q8W1F2TQV1"
    };

    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
