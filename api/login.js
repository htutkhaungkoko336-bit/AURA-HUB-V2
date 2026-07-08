import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore'; // FieldValue ကို ဒီမှာ ထည့်လိုက်ပါတယ်

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { phone, deviceId } = req.body;

        if (!phone || !deviceId || phone.length < 8 || phone.length > 11) {
            return res.status(400).json({ success: false, message: "Invalid phone number or device ID" });
        }

        try {
            // ၁။ Device ID ကို တခြားဖုန်းနံပါတ်တွေမှာ သုံးထားလား စစ်မယ်
            const deviceCheck = await db.collection('users').where('deviceId', '==', deviceId).get();
            
            if (!deviceCheck.empty && deviceCheck.docs[0].id !== phone) {
                return res.status(403).json({ 
                    success: false, 
                    message: "ယခင်ဝင်ခဲ့သည့် Phone Number ဖြင့် ဝင်ပေးပါ။" 
                });
            }

            // ၂။ ဖုန်းနံပါတ် ရှိမရှိ စစ်ဆေးခြင်း
            const userRef = db.collection('users').doc(phone);
            
            // Login အချိန်ကို ပြင်ဆင်ခြင်း
            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Yangon',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(now);

            // ၃။ User အချက်အလက်များ သိမ်းဆည်းခြင်း / Update လုပ်ခြင်း
            await userRef.set({
                phoneNumber: phone,
                deviceId: deviceId,
                lastLoginAt: formattedDate, // နောက်ဆုံးဝင်တဲ့အချိန်
                loginHistory: FieldValue.arrayUnion(formattedDate) // Login History ကို Array ထဲထည့်မယ်
            }, { merge: true });

            res.status(200).json({ success: true, message: "Login Successful!" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}