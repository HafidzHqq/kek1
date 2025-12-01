// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDf7JPGPlymor3UKYbcuh13oNuzGVGu7OU",
  authDomain: "inovatec-7d4d2.firebaseapp.com",
  projectId: "inovatec-7d4d2",
  storageBucket: "inovatec-7d4d2.appspot.com", // Perbaiki di sini
  messagingSenderId: "180667716336",
  appId: "1:180667716336:web:e25d37c4a2fedf54636835",
  measurementId: "G-BCM8JWTGN9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;
