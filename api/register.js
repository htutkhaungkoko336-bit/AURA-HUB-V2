import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Initialize လုပ်ခြင်း
const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

// api/register.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const data = req.body;
        let dbData = {
            mode: data.mode,
            status: "pending",
            createdAt: data.createdAt
        };

        // Mode အလိုက် Field တွေကို ခွဲခြားသတ်မှတ်ခြင်း
        if (data.mode === '5vs5') {
            dbData.squadName = data.squadName;
            dbData.logo = data.logo; // 5vs5 Logo
            dbData.paymentScreenshot = data.paymentScreenshot; // 5vs5 Slip
            dbData.kpayName = data.kpayName;
            dbData.kpayNo = data.kpayNo;
        } else if (data.mode === '1vs1') {
            dbData.playerName = data.squadName; // Solo Player Name
            dbData.heroName = data.heroName;
            dbData.logo1vs1 = data.logo; // 1vs1 Logo (Field name ပြောင်းလိုက်တယ်)
            dbData.paymentScreenshot1vs1 = data.paymentScreenshot; // 1vs1 Slip (Field name ပြောင်းလိုက်တယ်)
            dbData.kpayName = data.kpayName;
            dbData.kpayNo = data.kpayNo;
        }

        // Database ထဲသို့ သိမ်းဆည်းခြင်း
        await db.collection('registrations').add(dbData);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}