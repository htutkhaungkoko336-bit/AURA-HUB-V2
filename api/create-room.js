const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { notify } = require('./notify'); // <-- ဒီနေရာမှာ notify.js ရှိတဲ့ လမ်းကြောင်းကို သေချာထည့်ပေးပါ

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
                const batch = db.batch();

                // ၁။ registrations ထဲမှ ဒီ deviceId နဲ့ ပတ်သက်တာတွေကို ရှာပြီး ဖျက်ရန် (သို့မဟုတ် update လုပ်ရန်)
                const regSnapshot = await db.collection('registrations').where('deviceId', '==', deviceId).get();
                regSnapshot.docs.forEach((regDoc) => {
                    batch.delete(regDoc.ref);
                });

                // ၂. userKeys ထဲမှ Key ကို ဖျက်ရန် (သို့မဟုတ် docId အနေနဲ့ deviceId သုံးထားလျှင်)
                const keyDocRef = db.collection('userKeys').doc(deviceId);
                const keyDocSnap = await keyDocRef.get();
                if (keyDocSnap.exists) {
                    batch.delete(keyDocRef);
                } else {
                    // query ဖြင့် ရှာတွေ့ပါကလည်း ဖြတ်ရန်
                    const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();
                    keysQuery.docs.forEach((kDoc) => {
                        batch.delete(kDoc.ref);
                    });
                }

                // ၃။ rooms ထဲတွင် Host သို့မဟုတ် Joiner အနေနဲ့ ပါဝင်နေသော Room များကို ရှာပြီး ဖျက်ရန်
                const hostRoomSnap = await db.collection('rooms').where('hostDeviceId', '==', deviceId).get();
                hostRoomSnap.docs.forEach((roomDoc) => {
                    batch.delete(roomDoc.ref);
                });

                const joinerRoomSnap = await db.collection('rooms').where('joinerDeviceId', '==', deviceId).get();
                joinerRoomSnap.docs.forEach((roomDoc) => {
                    batch.delete(roomDoc.ref);
                });

                // ၄။ matches collection ထဲမှာပါ ကျန်ခဲ့တာရှိရင် ရှင်းထုတ်ရန်
                const hostMatchSnap = await db.collection('matches').where('host.deviceId', '==', deviceId).get();
                hostMatchSnap.docs.forEach((matchDoc) => {
                    batch.delete(matchDoc.ref);
                });

                const joinerMatchSnap = await db.collection('matches').where('joiner.deviceId', '==', deviceId).get();
                joinerMatchSnap.docs.forEach((matchDoc) => {
                    batch.delete(matchDoc.ref);
                });

                // Batch ဖြင့် အကုန် တစ်ပြိုင်နက် ဖျက်မည်
                await batch.commit();

                // ၅။ Refund Group ဆီသို့ Telegram Noti ပို့ခြင်း
                try {
                    if (!regSnapshot.empty) {
                        const regData = regSnapshot.docs[0].data();
                        await notify('REFUND', {
                            id: regSnapshot.docs[0].id,
                            ...regData,
                            refund: 'yes'
                        });
                    }
                } catch (err) {
                    console.error("Telegram Notify Error:", err);
                }

                return res.status(200).json({ 
                    success: true, 
                    message: "Refund တောင်းဆိုမှု အောင်မြင်ပါသည်။ အချက်အလက်ဟောင်းများအားလုံးကို ရှင်းလင်းပြီးပါပြီ။" 
                });
            }
            // ၂။ ROOM ဖန်တီးခြင်း လုပ်ငန်းစဉ် (Default)
            const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();

            if (keysQuery.empty) {
                return res.status(403).json({ 
                    success: false, 
                    message: "သင့်တွင် အသုံးပြုနိုင်သော Key မရှိသေးပါ။ ကျေးဇူးပြု၍ Key အရင်ဝယ်ပါ။" 
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