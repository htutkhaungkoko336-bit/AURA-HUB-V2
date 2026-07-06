const admin = require('firebase-admin');

// 1. Environment Variable ရှိမရှိ အရင်စစ်ပါ
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("FIREBASE_SERVICE_ACCOUNT variable is missing!");
}

// 2. Firebase Initialize
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Failed to parse JSON:", e);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        const snapshot = await db.collection('users').get();
        return res.status(200).json({ status: 'Success', count: snapshot.size });
    } catch (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}