import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// If using Firebase locally or with a service account:
if (!getApps().length) {
    // Initialize without credentials uses GOOGLE_APPLICATION_CREDENTIALS environment variable
    initializeApp({});
}

export const db = getFirestore();
export const auth = getAuth();
