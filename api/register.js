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
        const deviceId = data.deviceId;

        if (!deviceId) throw new Error("Device ID မပါဝင်ပါ");

        let dbData = {
            deviceId: deviceId,
            mode: data.mode,
            status: "pending", // Update လုပ်တိုင်း status ကို pending ပြန်ဖြစ်စေမယ်
            updatedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon', hour12: true })
        };

        // ... (data ဖြည့်တဲ့အပိုင်းကို အပေါ်ကအတိုင်း ထားထားပါ) ...
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

        // --- ပြင်ဆင်ထားသောအပိုင်း ---
        // ၁။ တူညီသော Device ID ရှိမရှိ စစ်ဆေးပါ
        const querySnapshot = await db.collection('registrations')
                                      .where('deviceId', '==', deviceId)
                                      .get();

        let docId;
        if (!querySnapshot.empty) {
            // အကယ်၍ ရှိနေရင် (Update လုပ်မယ်)
            const doc = querySnapshot.docs[0];
            docId = doc.id;
            await doc.ref.update(dbData);
        } else {
            // အကယ်၍ မရှိသေးရင် (အသစ်ဆောက်မယ်)
            const docRef = await db.collection('registrations').add(dbData);
            docId = docRef.id;
            await docRef.update({ docId: docId });
        }

        // notify ပို့ခြင်း
        const notifyData = { ...dbData, id: docId };
        await notify('REGISTRATION', notifyData);

        res.status(200).json({ success: true, id: docId });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}