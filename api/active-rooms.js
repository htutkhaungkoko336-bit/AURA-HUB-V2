const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    // 1️⃣ GET Method - Room များကို ဆွဲထုတ်ရန် (waiting သို့မဟုတ် matched များကို ဆွဲထုတ်ရန်)
    if (req.method === 'GET') {
        try {
            const { type, deviceId } = req.query;

            // အကယ်၍ Active Matches များကို တောင်းဆိုလျှင် (Playing Tab အတွက်) -> rooms collection ကိုသာ သုံးမည်
            if (type === 'matches' || type === 'rooms') {
                if (!deviceId) {
                    return res.status(400).json({ success: false, message: "Device ID is required" });
                }

                // 🔥 matches အစား rooms collection ကို တိုက်ရိုက် query ထုတ်မည်
                const roomsSnapshot = await db.collection('rooms')
                    .where('status', 'in', ['pending_confirmation', 'matched', 'ready'])
                    .get();

                let matchList = [];
                roomsSnapshot.forEach(doc => {
                    const roomData = doc.data();
                    // Host သို့မဟုတ် Joiner တစ်ဦးဦးဖြစ်မှ ထည့်မည်
                    if (roomData.host?.deviceId === deviceId || roomData.joiner?.deviceId === deviceId) {
                        matchList.push({
                            roomId: doc.id,
                            ...roomData
                        });
                    }
                });

                return res.status(200).json({ success: true, rooms: matchList });
            }

            // မူလ Room များကို ဆွဲထုတ်သည့် Logic (Waiting Tab အတွက်)
    // မူလ Room များကို ဆွဲထုတ်သည့် Logic (Waiting Tab အတွက်)
    const roomsSnapshot = await db.collection('rooms').where('status', '==', 'waiting').get();
    let roomList = [];

    for (const doc of roomsSnapshot.docs) {
        let roomData = doc.data();
        
        const regSnapshot = await db.collection('registrations')
            .where('deviceId', '==', roomData.hostDeviceId)
            .get();

        let regData = {};
        if (!regSnapshot.empty) {
            regData = regSnapshot.docs[0].data();
        }

        let rawLogo = regData.logo || roomData.logo || '';
        // 🔥 Logo လင့်ခ်က hash ဖြစ်နေရင် (သို့) http နဲ့မစရင် ပုံမှန် placeholder သို့မဟုတ် အမှန်ပြင်ရန်
        let validLogo = (rawLogo && rawLogo.startsWith('http') && !rawLogo.endsWith('#')) 
            ? rawLogo 
            : 'https://i.ibb.co/6Z29F3b/default-logo.png'; // လိုအပ်သော Default ပုံလင့်ခ်ထည့်ရန်

        // 🔥 entryFee ကို စာသားသန့်စင်ရန်
        let rawFee = regData.entryFee || roomData.entryFee || '0';
        let cleanFee = typeof rawFee === 'string' ? rawFee.replace(/[^0-9]/g, '') : rawFee;
        let formattedFee = cleanFee ? `${cleanFee} Ks` : '0 Ks';

        roomList.push({
            roomId: doc.id,
            deviceId: roomData.hostDeviceId,
            logo: validLogo,
            squadName: regData.squadName || roomData.teamName || 'My Team',
            heroName: regData.heroName || roomData.heroName || '',
            playerName: regData.playerName || roomData.playerName || '',
            mode: roomData.mode || '5vs5',
            entryFee: formattedFee,
            status: roomData.status,
            contact: regData.contact || roomData.contact || '' 
        });
    }

        return res.status(200).json({ success: true, rooms: roomList });
        } catch (error) {
            console.error("Error fetching rooms/matches:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    // 2️⃣ POST Method - Registration, Ready လုပ်ရန် နှင့် Match ဖျက်သိမ်းရန်
    if (req.method === 'POST') {
        try {
            const data = req.body;
            const action = data.action;

            // 🌟 Match Ready ပြုလုပ်ခြင်း
            if (action === 'ready') {
                const { roomId, deviceId, status } = data;
                if (!roomId || !deviceId) {
                    return res.status(400).json({ success: false, message: "Room ID and Device ID are required" });
                }

                // 🔥 matches အစား rooms collection ကို သုံးမည်
                const roomRef = db.collection('rooms').doc(roomId);
                const roomDoc = await roomRef.get();
                if (!roomDoc.exists) {
                    return res.status(404).json({ success: false, message: "Room not found" });
                }

                const roomData = roomDoc.data();
                let updateData = {};

                let hostDevId = roomData.host?.deviceId || roomData.hostDeviceId;
                let joinerDevId = roomData.joiner?.deviceId || roomData.joinerDeviceId;

                if (hostDevId === deviceId) {
                    updateData['host.confirmed'] = status !== undefined ? status : true;
                } else if (joinerDevId === deviceId) {
                    updateData['joiner.confirmed'] = status !== undefined ? status : true;
                } else {
                    return res.status(403).json({ success: false, message: "Unauthorized" });
                }

                await roomRef.update(updateData);
                return res.status(200).json({ success: true, message: "Successfully confirmed" });
            }

            // 🌟 Match ဖျက်သိမ်းခြင်း (Cancel) -> rooms ထဲက doc ကို ဖျက်မည် (သို့မဟုတ် status ကို waiting ပြန်ပြောင်းမည်၊ သင့်လုပ်ငန်းစဉ်အပေါ်မူတည်သည်)
            if (action === 'cancel') {
                const { roomId } = data;
                if (!roomId) {
                    return res.status(400).json({ success: false, message: "Room ID is required" });
                }

                // 🔥 matches အစား rooms collection တွင် ရှိသော room ကို ဖြတ်မည်
                await db.collection('rooms').doc(roomId).delete();
                return res.status(200).json({ success: true, message: "Match cancelled successfully" });
            }

            // မူလ Registration / Contact Update လုပ်သည့် Logic
            const deviceId = data.deviceId;
            if (!deviceId) {
                return res.status(400).json({ success: false, message: "Device ID is required" });
            }

            const regRef = db.collection('registrations');
            const snapshot = await regRef.where('deviceId', '==', deviceId).get();

            let dbData = {
                deviceId: deviceId,
                updatedAt: new Date().toISOString()
            };

            if (data.logo) dbData.logo = data.logo;
            if (data.paymentScreenshot) dbData.paymentScreenshot = data.paymentScreenshot;
            if (data.mode) dbData.mode = data.mode;
            if (data.squadName) dbData.squadName = data.squadName;
            if (data.heroName) dbData.heroName  = data.heroName;
            if (data.playerName) dbData.playerName = data.playerName;
            if (data.entryFee) dbData.entryFee = data.entryFee;
            if (data.contact) dbData.contact = data.contact;

            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await regRef.doc(docId).set(dbData, { merge: true });
            } else {
                await regRef.add(dbData);
            }

            return res.status(200).json({ success: true, message: "Successfully updated" });
        } catch (error) {
            console.error("Error in POST handler:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
};