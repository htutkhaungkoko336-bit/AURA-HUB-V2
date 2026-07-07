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

        try {
            // Firebase ထဲတွင် ဖုန်းနံပါတ်ကို သိမ်းခြင်း
            await db.collection('users').doc(phone).set({
                phone: phone,
                loginAt: new Date().toISOString()
            });

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}