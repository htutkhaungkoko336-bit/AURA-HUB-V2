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
        const { deviceId, teamName, logo, mlbbId, playerName, mode, entryFee } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, message: "Device ID မတွေ့ရှိပါ။" });
        }

        try {
            // ၁။ User မှာ Active Key ရှိမရှိ Field ထဲက deviceId နဲ့ Query ထုတ်၍ စစ်ဆေးခြင်း
            const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();

            if (keysQuery.empty) {
                return res.status(403).json({ 
                    success: false, 
                    message: "သင့်တွင် အသုံးပြုနိုင်သော Key မရှိသေးပါ။ ကျေးဇူးပြု၍ Key အရင်ဝယ်ယူပါ။" 
                });
            }

            // တွေ့သွားတဲ့ Document ကို ယူသုံးရန်
            const keyDoc = keysQuery.docs[0];
            const keyRef = keyDoc.ref; 
            const keyData = keyDoc.data();

            if (keyData.status !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: "သင့် Key မှာ လက်ရှိ Room တစ်ခုခုတွင် အသုံးပြုနေပြီးသား (သို့မဟုတ်) အသုံးမပြုနိုင်သော အနေအထားတွင် ရှိနေပါသည်။" 
                });
            }

            // 🌟 ၂။ User ၏ registrations ဒေတာကို ရှာပြီး မူလ Mode ကို အဓိက သုံးရန် (Mode ရောထွေးမှု ကာကွယ်ရန်)
            const regSnapshot = await db.collection('registrations')
                .where('deviceId', '==', deviceId)
                .get();

            let actualMode = mode || "1vs1"; // Frontend က ပို့လိုက်သော mode (သို့မဟုတ် default)
            if (!regSnapshot.empty) {
                const regData = regSnapshot.docs[0].data();
                if (regData.mode) {
                    actualMode = regData.mode; // Register တင်ထားခဲ့သည့် မူလ mode ကိုသာ တိကျစွာ သုံးမည်
                }
            }

            // ၃။ အချိန်ကို ပြင်ဆင်ခြင်း
            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Yangon',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(now);

            // ၄။ `rooms` collection အသစ်ထဲသို့ Room အချက်အလက်များ သိမ်းဆည်းခြင်း (actualMode ကို ထည့်သွင်းမည်)
            const roomRef = await db.collection('rooms').add({
                hostDeviceId: deviceId,
                teamName: teamName || "My Team",
                logo: logo || "",
                mlbbId: mlbbId || "",
                playerName: playerName || "",
                mode: actualMode, // <-- မှန်ကန်သော မူလ Mode ကို အသုံးပြုခြင်း
                entryFee: entryFee || keyData.keyTier,
                status: 'waiting',
                createdAt: formattedDate
            });

            const roomId = roomRef.id;

            // ၅။ User ၏ Key Status ကို 'in-use' သို့ ပြောင်းလဲပြီး `roomId` ကို ချိတ်ပေးခြင်း
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
            console.error("Create Room Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
};