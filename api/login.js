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
        const { phone, deviceId } = req.body;

        if (!phone || !deviceId || phone.length < 8 || phone.length > 11) {
            return res.status(400).json({ success: false, message: "Invalid phone number or device ID" });
        }

        try {
            // ၁။ အရေးကြီးဆုံး: ဒီ Device ID ကို တခြားဖုန်းနံပါတ်တွေမှာ သုံးထားလား အရင်စစ်မယ်
            const deviceCheck = await db.collection('users').where('deviceId', '==', deviceId).get();
            
            // တခြားဖုန်းနံပါတ်မှာ ဒီ Device ID ရှိနေပြီး၊ အဲ့ဒီဖုန်းက လက်ရှိရိုက်လိုက်တဲ့ဖုန်းနဲ့ မတူရင်
            if (!deviceCheck.empty && deviceCheck.docs[0].id !== phone) {
                return res.status(403).json({ 
                    success: false, 
                    message: "အမှား - ဤ Device ကို တခြားဖုန်းနံပါတ်တစ်ခုဖြင့် အသုံးပြုထားပါသည်။" 
                });
            }

            // ၂။ ဖုန်းနံပါတ် ရှိမရှိ စစ်ဆေးခြင်း
            const userRef = db.collection('users').doc(phone);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                // ၃။ ရှိနေလျှင် Device ID တူမတူ စစ်ခြင်း
                const userData = userDoc.data();
                if (userData.deviceId !== deviceId) {
                    return res.status(403).json({ 
                        success: false, 
                        message: "အမှား - ဤဖုန်းနံပါတ်ကို တခြား Device တွင် အသုံးပြုထားပါသည်။" 
                    });
                }
            } else {
                // ၄။ အသစ်ဝင်လျှင် အချိန်နှင့်တကွ မှတ်သားခြင်း
                const now = new Date();
                const formattedDate = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Yangon',
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                }).format(now);

                await userRef.set({
                    phoneNumber: phone,
                    deviceId: deviceId,
                    loginAt: formattedDate
                });
            }

            res.status(200).json({ success: true, message: "Login အောင်မြင်ပါသည်။" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}