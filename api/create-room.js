const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    // 1️⃣ POST Method - Room အသစ်ဖန်တီးရန်
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

            const keyDoc = keysQuery.docs[0];
            const keyRef = keyDoc.ref; 
            const keyData = keyDoc.data();

            if (keyData.status !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: "သင့် Key မှာ လက်ရှိ Room တစ်ခုခုတွင် အသုံးပြုနေပြီးသား (သို့မဟုတ်) အသုံးမပြုနိုင်သော အနေအထားတွင် ရှိနေပါသည်။" 
                });
            }

            // ၂. အချိန်ကို ပြင်ဆင်ခြင်း
            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Yangon',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(now);

            // ၃။ `rooms` collection အသစ်ထဲသို့ Room အချက်အလက်များ သိမ်းဆည်းခြင်း
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

            // ၄။ User ၏ Key Status ကို 'in-use' သို့ ပြောင်းလဲပြီး `roomId` ကို ချိတ်ပေးခြင်း
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
    } 
    // 2️⃣ GET Method - Active Room စာရင်းများကို ဆွဲထုတ်ရန်
    else if (req.method === 'GET') {
        try {
            const roomsSnapshot = await db.collection('rooms').where('status', '==', 'waiting').get();
            let roomList = [];

            for (const doc of roomsSnapshot.docs) {
                let roomData = doc.data();
                
                // registrations collection ထဲမှ hostDevice နဲ့ ကိုက်ညီတဲ့ ဒေတာ ယူရန်
                const regSnapshot = await db.collection('registrations')
                    .where('deviceId', '==', roomData.hostDeviceId)
                    .get();

                let regData = {};
                if (!regSnapshot.empty) {
                    regData = regSnapshot.docs[0].data();
                }

                roomList.push({
                    roomId: doc.id,
                    deviceId: roomData.hostDeviceId,
                    logo: regData.logo || roomData.logo || '',
                    squadName: regData.heroName || roomData.teamName || 'My Team',
                    mode: roomData.mode || '1vs1',
                    entryFee: regData.entryFee || roomData.entryFee || '0',
                    status: roomData.status
                });
            }

            return res.status(200).json({ success: true, rooms: roomList });
        } catch (error) {
            console.error("Error fetching rooms:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    } 
    // 3️⃣ အခြား Method များအတွက်
    else {
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
};