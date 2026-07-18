import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { notify } from './notify'; // notify ဖိုင်ကို import လုပ်ပါ

// Firebase Initialize လုပ်ခြင်း
const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const data = req.body;
        // dbData ထဲမှာ deviceId ကို ထည့်သိမ်းပေးပါ
        let dbData = {
                    deviceId: data.deviceId, // ဒီနေရာမှာ deviceId ကို ထည့်ပါ
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

    const docRef = await db.collection('registrations').add(dbData);

    // ၂။ docId ကို သိမ်းဆည်းခြင်း (ဒီနေရာမှာ docRef ကို သုံးပါ)
    const docId = docRef.id;
    await docRef.update({ docId: docId });

    // notify function သို့ docId အပါအဝင် ပေးပို့ခြင်း
    const notifyData = { ...dbData, id: docId }; 
    await notify('REGISTRATION', notifyData);

    // response ပေးတဲ့အခါ တစ်ခါပဲပေးပါ (၂ ခါမပေးရပါ)
    res.status(200).json({ success: true, id: docId });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
