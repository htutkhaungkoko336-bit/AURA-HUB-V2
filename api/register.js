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
            
            // Player 1 မှ 5 အထိ သေချာထည့်ပေးပါ
            dbData.player1 = data.player1 || null;
            dbData.player2 = data.player2 || null;
            dbData.player3 = data.player3 || null;
            dbData.player4 = data.player4 || null;
            dbData.player5 = data.player5 || null;
        }
        else if (data.mode === '1vs1') {
            dbData.playerName = data.squadName || null;
            dbData.mlbbId = data.mlbbId || null; // ID အသစ်
            dbData.heroName = data.heroName || null;
            dbData.entryFee = data.entryFee || null; // Fee အသစ်
            dbData.logo = data.logo || null; // 1vs1 Logo
            dbData.paymentScreenshot = data.paymentScreenshot || null; // 1vs1 Slip
            dbData.kpayName = data.kpayName || null;
            dbData.kpayNo = data.kpayNo || null;
        }
        // Database ထဲသို့ သိမ်းဆည်းခြင်း
        await db.collection('registrations').add(dbData);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}