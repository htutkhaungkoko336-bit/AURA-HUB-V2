const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const { action, deviceId, teamName, logo, mlbbId, playerName, mode, entryFee } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, message: "Device ID မတွေ့ရှိပါ။" });
        }

        try {
        // Refund Action ရောက်လာသည့်အခါ
        if (action === 'refund') {
            const regSnapshot = await db.collection('registrations').where('deviceId', '==', deviceId).get();

            if (regSnapshot.empty) {
                return res.status(404).json({ success: false, message: "Registration အချက်အလက် မတွေ့ရှိပါ။" });
            }

            const regDoc = regSnapshot.docs[0];
            const docId = regDoc.id;
            const regData = regDoc.data();

            // ၁။ registrations ထဲတွင် refundStatus နှင့် အချက်အလက်များ ထည့်သွင်းခြင်း
            await regDoc.ref.update({
                refundStatus: 'pending', 
                refundRequestedAt: new Date().toISOString()
            });

            // ၂။ userKeys ထဲမှ Key ကို ဖျက်ခြင်း
            await db.collection('userKeys').doc(deviceId).delete();

            // ၃။ rooms ထဲတွင် hostDeviceId နှင့် တူသော Room ရှိပါက ဖျက်ခြင်း
            const roomSnapshot = await db.collection('rooms').where('hostDeviceId', '==', deviceId).get();
            if (!roomSnapshot.empty) {
                const batch = db.batch();
                roomSnapshot.docs.forEach((roomDoc) => {
                    batch.delete(roomDoc.ref);
                });
                await batch.commit();
            }

            // ၄။ Refund Group ဆီသို့ Telegram Noti ပို့ခြင်း (notify function ကို သုံး၍)
            try {
                await notify('REFUND', {
                    id: docId,
                    ...regData
                });
            } catch (err) {
                console.error("Telegram Notify Error:", err);
            }
            return res.status(200).json({ 
                success: true, 
                message: "Refund တောင်းဆိုမှု အောင်မြင်ပါသည်။ Key နှင့် Room များကို ဖျက်ပြီး Admin ထံ အကြောင်းကြားပြီးပါပြီ။" 
            });
}
            // ၂။ ROOM ဖန်တီးခြင်း လုပ်ငန်းစဉ် (Default)
            const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();

            if (keysQuery.empty) {
                return res.status(403).json({ 
                    success: false, 
                    message: "သင့်တွင် အသုံးပြုနိုင်သော Key မရှိသေးပါ။ ကျေးဇူးပြု၍ Key အရင်ဝယ်ယူပါ။" 
                });
            }

            const keyDoc = keysQuery.docs[0];
            const keyRef = keyDoc.ref; 
            const keyData = keyDoc.data();

            if (keyData.status !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: "သင့် Key မှာ လက်ရှိ Room တစ်ခုခုတွင် အသုံးပြုနေပြီးသား (သို့မဟုတ်) အသုံးမပြုနိုင်သော အနေအထားတွင် ရှိနေပါသည်။" 
                });
            }

            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Yangon',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(now);

            const roomRef = await db.collection('rooms').add({
                hostDeviceId: deviceId,
                teamName: teamName || "My Team",
                logo: logo || "",
                mlbbId: mlbbId || "",
                playerName: playerName || "",
                mode: mode || "1vs1",
                entryFee: entryFee || keyData.keyTier,
                status: 'waiting',
                createdAt: formattedDate
            });

            const roomId = roomRef.id;

            await keyRef.update({
                status: 'in-use',
                roomId: roomId
            });

            return res.status(200).json({ 
                success: true, 
                message: "Room အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။",
                roomId: roomId 
            });

        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
};