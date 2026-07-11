import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// အမှားပြင်ရန်: ./notify မှ ./notify.js သို့ ပြောင်းပါ
import { notify } from './notify.js'; 

// Firebase Initialize လုပ်ခြင်း (ပိုမိုသေချာစေရန်)
const firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = !getApps().length 
    ? initializeApp({ credential: cert(firebaseConfig) }) 
    : getApp();

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
            dbData.playerName = data.squadName || null; 
            dbData.mlbbId = data.mlbbId || null;
            dbData.heroName = data.heroName || null;
            dbData.entryFee = data.entryFee || null;
            dbData.logo = data.logo || null;
            dbData.paymentScreenshot = data.paymentScreenshot || null;
            dbData.kpayName = data.kpayName || null;
            dbData.kpayNo = data.kpayNo || null;
        }

        // ၁။ Database ထဲသို့ သိမ်းဆည်းခြင်း
        const docRef = await db.collection('registrations').add(dbData);
        
        // ၂။ Telegram ကို အကြောင်းကြားခြင်း
        await notify('REGISTRATION', dbData, docRef.id);

        res.status(200).json({ success: true, registrationId: docRef.id });
        
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}