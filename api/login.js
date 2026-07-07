import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase ကို တစ်ကြိမ်ပဲ initialize လုပ်ကြောင်း စစ်ဆေးခြင်း
const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { phone } = req.body;

        // ၁။ ဖုန်းနံပါတ် အရှည်ကို စစ်ဆေးခြင်း
        if (!phone || phone.length < 8 || phone.length > 11) {
            return res.status(400).json({ 
                success: false, 
                message: "ဖုန်းနံပါတ် မမှန်ကန်ပါ။ 8 လုံးမှ 11 လုံးကြား ဖြစ်ရပါမည်။" 
            });
        }

        try {
            // ၂။ Firebase ထဲတွင် ဖုန်းနံပါတ်ကို သိမ်းခြင်း
            await db.collection('users').doc(phone).set({
                phone: phone,
                loginAt: new Date().toISOString()
            });

            res.status(200).json({ success: true, message: "Login အောင်မြင်ပါသည်။" });
        } catch (error) {
            // Firebase Error များကိုလည်း ဖမ်းယူနိုင်ရန်
            res.status(500).json({ success: false, message: "Database Error: " + error.message });
        }
    } else {
        // POST method မဟုတ်လျှင်
        res.status(405).json({ success: false, message: "Method not allowed" });
    }
}
const { phone, deviceId } = req.body; // လက်ခံခြင်း

await db.collection('users').doc(phone).set({
    phone: phone,
    deviceId: deviceId, // သိမ်းခြင်း
    loginAt: new Date().toISOString()
});