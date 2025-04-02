import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA51dcqY03mgGcDAeRDwp3YKkM3N76UcHM",
  authDomain: "boiler-resources.firebaseapp.com",
  projectId: "boiler-resources",
  storageBucket: "boiler-resources.firebasestorage.app",
  messagingSenderId: "365007205003",
  appId: "1:365007205003:web:6d0f34aa497c5ca22e9a8e",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app); // Get the storage instance

// Export the storage and any needed functions
export { storage, ref, uploadBytes };
