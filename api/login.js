import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        // deviceId ပါ ပေါင်းပြီး လက်ခံလိုက်ပါတယ်
        const { phone, deviceId } = req.body;

        // ၁။ Validation (ဖုန်းနံပါတ် စစ်ဆေးခြင်း)
        if (!phone || phone.length < 8 || phone.length > 11) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Phone Number" 
            });
        }

        try {
            // AM/PM Format ရယူခြင်း
            const now = new Date();
            const timeString = now.toLocaleString('en-US', { 
                dateStyle: 'short', 
                timeStyle: 'medium' 
            });
            // ၂။ Firebase ထဲတွင် ဖုန်းနှင့် deviceId ကို တွဲသိမ်းခြင်း
            await db.collection('users').doc(phone).set({
                phoneNumber: phone,
                deviceId: deviceId || "unknown", // deviceId မပါလာရင် unknown လို့ မှတ်မယ်
                loginAt: timeString 
            });

            res.status(200).json({ success: true, message: "Login Successful" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Database Error: " + error.message });
        }
    } else {
        res.status(405).json({ success: false, message: "Method not allowed" });
    }
}