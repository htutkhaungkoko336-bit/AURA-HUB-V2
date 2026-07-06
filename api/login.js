const admin = require('firebase-admin');

// 1. serviceAccount ကို environment variable ကနေ အရင်ယူပါ
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 2. admin.apps.length ကို စစ်မယ့်အစား app ရှိမရှိပဲ စစ်ပါ
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        const snapshot = await db.collection('users').get();
        res.status(200).json({ status: 'Success', dataLength: snapshot.size });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}