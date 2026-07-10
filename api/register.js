// api/register.js (ဒီဖိုင်ထဲမှာ Admin SDK နဲ့ Firebase ကို ရေးမယ်)
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase ကို Backend မှာ Initialize လုပ်တာ (မင်းရဲ့ login.js ထဲကအတိုင်းပဲ)
const app = getApps().length === 0 ? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { squadName, kpayName, kpayNo, logo, paymentScreenshot } = req.body;

        // Admin SDK နဲ့ Database ထဲကို လုံခြုံစွာထည့်မယ်
        await db.collection('registrations').add({
            squadName,
            kpayName,
            kpayNo,
            logo,
            paymentScreenshot,
            status: "pending",
            createdAt: new Date().toISOString()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}