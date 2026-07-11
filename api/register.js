import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { notify } from './notify.js'; // notify ဖိုင်ကို import လုပ်ပါ

// Firebase Initialize လုပ်ခြင်း
const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const data = req.body;
        
        // အချက်အလက်များကို dbData အဖြစ် စုစည်းခြင်း
        let dbData = {
            mode: data.mode,
            status: "pending",
            createdAt: new Date().toLocaleString('en-GB', { 
                timeZone: 'Asia/Yangon',
                hour12: true 
            })
        };

        if (data.mode === '5vs5') {
            dbData.squadName = data.squadName || null;
            dbData.logo = data.logo || null;
            dbData.paymentScreenshot = data.paymentScreenshot || null;
            dbData.kpayName = data.kpayName || null;
            dbData.kpayNo = data.kpayNo || null;
            dbData.entryFee = data.entryFee || null;
            dbData.player1 = data.player1 || null;
            dbData.player2 = data.player2 || null;
            dbData.player3 = data.player3 || null;
            dbData.player4 = data.player4 || null;
            dbData.player5 = data.player5 || null;
        } else if (data.mode === '1vs1') {
            dbData.playerName = data.squadName || null; // 1vs1 အတွက်နာမည်
            dbData.mlbbId = data.mlbbId || null;
            dbData.heroName = data.heroName || null;
            dbData.entryFee = data.entryFee || null;
            dbData.logo = data.logo || null;
            dbData.paymentScreenshot = data.paymentScreenshot || null;
            dbData.kpayName = data.kpayName || null;
            dbData.kpayNo = data.kpayNo || null;
        }

        // ၁။ Database ထဲသို့ သိမ်းဆည်းခြင်း
        await db.collection('registrations').add(dbData);

        // ၂။ Telegram ကို အကြောင်းကြားခြင်း
        // notify function ကို data အပြည့်အစုံနဲ့ လှမ်းခေါ်လိုက်ပါ
        await notify('REGISTRATION', dbData, docRef.id);
        res.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}