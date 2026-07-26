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
        const { deviceId, roomId, joinerData } = req.body;

        if (!deviceId || !roomId) {
            return res.status(400).json({ success: false, message: "Device ID သို့မဟုတ် Room ID မပြည့်စုံပါ။" });
        }

        try {
            // ၁။ Room တကယ်ရှိမရှိ စစ်ဆေးခြင်း
            const roomRef = db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();

            if (!roomDoc.exists) {
                return res.status(404).json({ success: false, message: "ဤ Room သည် မရှိတော့ပါ (သို့မဟုတ်) ဖျက်လိုက်ပါပြီ။" });
            }

            const roomData = roomDoc.data();

            // ၂. Room က waiting အနေအထား ဟုတ်မဟုတ် စစ်ဆေးခြင်း
            if (roomData.status !== 'waiting') {
                return res.status(400).json({ success: false, message: "ဤ Room သည် အခြားသူနှင့် Match ပြီးသွားပါပြီ။" });
            }

            // ၃. ကိုယ့်အခန်း ကိုယ်ပြန် join တာကို တားမြစ်ခြင်း
            if (roomData.hostDeviceId === deviceId) {
                return res.status(400).json({ message: "မိမိဖန်တီးထားသော Room ကို မိမိပြန် join ၍ မရပါ။" });
            }

            // ၄. Join မည့်သူ့မှာ Active Key ရှိမရှိ စစ်ဆေးခြင်း
            const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();

            if (keysQuery.empty) {
                return res.status(403).json({ success: false, message: "သင့်တွင် အသုံးပြုနိုင်သော Key မရှိသေးပါ။" });
            }

            const keyDoc = keysQuery.docs[0];
            const keyData = keyDoc.data();

            if (keyData.status !== 'active') {
                return res.status(400).json({ success: false, message: "သင့် Key မှာ အသုံးမပြုနိုင်သော အနေအထားတွင် ရှိနေပါသည်။" });
            }

            // ၅. Host ၏ Registration အချက်အလက်များကိုပါ ထပ်မံဆွဲထုတ်ရန် (Team 2 ခုလုံးရဲ့ အချက်အလက်အပြည့်အစုံရရန်)
            const hostRegQuery = await db.collection('registrations').where('deviceId', '==', roomData.hostDeviceId).get();
            const hostData = !hostRegQuery.empty ? hostRegQuery.docs[0].data() : {};

            // ၆. `matches` collection အသစ်ထဲသို့ နှစ်ဖက်စလုံး၏ အချက်အလက်များ သိမ်းဆည်းခြင်း
            const matchRef = await db.collection('matches').add({
                roomId: roomId,
                mode: roomData.mode,
                entryFee: roomData.entryFee,
                // Host Team info
                host: {
                    deviceId: roomData.hostDeviceId,
                    teamName: roomData.teamName || hostData.squadName || hostData.playerName || "Host Team",
                    logo: roomData.logo || hostData.logo || "",
                    mlbbId: roomData.mlbbId || hostData.mlbbId || "",
                    playerName: roomData.playerName || hostData.playerName || "",
                    confirmed: false // Confirm နှိပ်ထားခြင်း ရှိမရှိ
                },
                // Joiner Team info
                joiner: {
                    deviceId: deviceId,
                    teamName: joinerData.teamName || joinerData.squadName || joinerData.playerName || "Joiner Team",
                    logo: joinerData.logo || "",
                    mlbbId: joinerData.mlbbId || "",
                    playerName: joinerData.playerName || joinerData.name || joinerData.player || "", // <-- ဒီနေရာကို အစုံထည့်ပေးလိုက်ပါ
                    confirmed: false
                },
                status: 'pending_confirmation', // နှစ်ဖက်လုံး Confirm စောင့်ဆိုင်းနေသည့် status
                createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon', hour12: true })
            });

            // ၇. မူလ Room ၏ status ကို 'matched' သို့ ပြောင်းလဲခြင်း
            await roomRef.update({
                status: 'matched',
                joinerDeviceId: deviceId,
                matchId: matchRef.id
            });

            // ၈. Joiner ၏ Key Status ကို 'in-use' သို့ ပြောင်းလဲခြင်း
            await keyDoc.ref.update({
                status: 'in-use',
                roomId: roomId
            });

            return res.status(200).json({ 
                success: true, 
                message: "Match ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။",
                matchId: matchRef.id
            });

        } catch (error) {
            console.error("Join Room Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
};