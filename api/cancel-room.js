const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const { roomId, deviceId } = req.body;

    if (!roomId || !deviceId) {
        return res.status(400).json({ success: false, message: "Room ID သို့မဟုတ် Device ID မရှိပါ။" });
    }

    try {
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();

        if (!roomDoc.exists) {
            return res.status(404).json({ success: false, message: "Room မတွေ့ရှိပါ။" });
        }

        const roomData = roomDoc.data();

        // Host ဟုတ်မဟုတ် စစ်ဆေးခြင်း
        if (roomData.hostDeviceId !== deviceId) {
            return res.status(403).json({ success: false, message: "ဤ Room ကို ဖျက်ရန် ခွင့်ပြုချက်မရှိပါ။" });
        }

        // ၁။ Room ကို ဖျက်မည် (သို့မဟုတ် status ကို closed/cancelled ပြောင်းနိုင်ပါသည်)
        await roomRef.delete();

        // ၂။ User ၏ Key Status ကို 'active' သို့ ပြန်ပြောင်းပေးခြင်း
        const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();
        if (!keysQuery.empty) {
            const keyDoc = keysQuery.docs[0];
            await keyDoc.ref.update({
                status: 'active',
                roomId: null
            });
        }

        return res.status(200).json({ success: true, message: "Room ဖျက်သိမ်းခြင်း အောင်မြင်ပါသည်။" });

    } catch (error) {
        console.error("Cancel Room Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};