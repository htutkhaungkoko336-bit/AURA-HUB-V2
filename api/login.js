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

        if (!phone || phone.length < 8 || phone.length > 11) {
            return res.status(400).json({ success: false, message: "Invalid Phone" });
        }

        try {
            // မြန်မာစံတော်ချိန်ဖြင့် အချိန်ရယူခြင်း
            const now = new Date();
            const options = { 
                timeZone: 'Asia/Yangon',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true 
            };
            
            // ရက်-လ-နှစ် ပုံစံရယူရန် formatter
            const formatter = new Intl.DateTimeFormat('en-GB', options);
            const parts = formatter.formatToParts(now);
            
            // 8-7-2026 10:30 PM ပုံစံဖန်တီးခြင်း
            const day = parts.find(p => p.type === 'day').value;
            const month = parts.find(p => p.type === 'month').value;
            const year = parts.find(p => p.type === 'year').value;
            const time = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value} ${parts.find(p => p.type === 'dayPeriod').value}`;
            
            const formattedDate = `${day}-${month}-${year} ${time}`;

            // Firebase ထဲတွင် သိမ်းခြင်း
            await db.collection('users').doc(phone).set({
                phoneNumber: phone,
                deviceId: deviceId || "unknown",
                loginAt: formattedDate // 8-7-2026 08:45 PM ပုံစံ ဖြစ်သွားပါမည်
            });

            res.status(200).json({ success: true, message: "Login အောင်မြင်ပါသည်။" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}