const admin = require('firebase-admin');

// Backend Initialize
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Vercel Serverless Function
export default async function handler(req, res) {
    // ဥပမာ- Database ထဲက Data ကို ဒီမှာ ခေါ်သုံးလို့ရပါပြီ
    const snapshot = await db.collection('users').get();
    res.status(200).json({ status: 'Success' });
}