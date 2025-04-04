import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Resolve the directory path
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account credentials
const serviceAccountPath = resolve(
  __dirname,
  "../config/firebaseAdminKey.json"
);
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "boiler-resources.firebasestorage.app", // Replace with your Firebase bucket name
});

const bucket = admin.storage().bucket();
export default bucket;
