import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Initialize လုပ်ခြင်း
const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        // Frontend က ပို့လာတဲ့ data အားလုံးကို destructure လုပ်ယူပါ
        const { squadName, kpayName, kpayNo, logo, paymentScreenshot, mode, createdAt } = req.body;

        // Firebase Firestore ထဲသို့ လုံခြုံစွာ သိမ်းဆည်းခြင်း
        await db.collection('registrations').add({
            squadName,
            kpayName,
            kpayNo,
            logo,
            paymentScreenshot,
            mode,               // 1vs1 သို့မဟုတ် 5vs5
            status: "pending",  // Admin က အတည်ပြုပေးရမည့် status
            createdAt: createdAt // Frontend ကနေ ပို့ပေးတဲ့ မြန်မာစံတော်ချိန်
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Firebase Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}