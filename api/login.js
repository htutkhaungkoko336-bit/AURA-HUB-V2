const admin = require('firebase-admin');

// Firebase ကို အန္တရာယ်ကင်းကင်း Initialize လုပ်ရန် function
function initializeFirebase() {
    try {
        // admin.apps ဆိုတာမျိုးကို တိုက်ရိုက်မခေါ်ပါနဲ့
        // ပထမဆုံး app ရှိမရှိ စစ်ပါ
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("Firebase init failed:", error);
    }
}

// Function ကို ခေါ်သုံးပါ
initializeFirebase();

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        const snapshot = await db.collection('users').get();
        return res.status(200).json({ status: 'Success', count: snapshot.size });
    } catch (error) {
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}