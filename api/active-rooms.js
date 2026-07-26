const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    // 1️⃣ GET Method - Room များကို ဆွဲထုတ်ရန် (သို့မဟုတ် Match များကို ဆွဲထုတ်ရန်)
    if (req.method === 'GET') {
        try {
            const { type, deviceId } = req.query;

            // အကယ်၍ Active Matches များကို တောင်းဆိုလျှင် (Playing Tab အတွက်)
            if (type === 'matches') {
                if (!deviceId) {
                    return res.status(400).json({ success: false, message: "Device ID is required" });
                }

                const matchesSnapshot = await db.collection('matches')
                    .where('status', 'in', ['pending_confirmation', 'matched', 'ready'])
                    .get();

                let matchList = [];
                matchesSnapshot.forEach(doc => {
                    const matchData = doc.data();
                    // Host သို့မဟုတ် Joiner တစ်ဦးဦးဖြစ်မှ ထည့်မည်
                    if (matchData.host?.deviceId === deviceId || matchData.joiner?.deviceId === deviceId) {
                        matchList.push({
                            roomId: doc.id,
                            ...matchData
                        });
                    }
                });

                return res.status(200).json({ success: true, rooms: matchList });
            }

            // မူလ Room များကို ဆွဲထုတ်သည့် Logic
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

                roomList.push({
                    roomId: doc.id,
                    deviceId: roomData.hostDeviceId,
                    logo: regData.logo || roomData.logo || '',
                    squadName: regData.squadName || roomData.teamName || 'My Team',
                    heroName: regData.heroName || roomData.heroName || '',
                    playerName: regData.playerName || roomData.playerName || '',
                    mode: roomData.mode || '5vs5',
                    entryFee: regData.entryFee || roomData.entryFee || '0',
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
                const { roomId, deviceId } = data;
                if (!roomId || !deviceId) {
                    return res.status(400).json({ success: false, message: "Room ID and Device ID are required" });
                }

                const matchRef = db.collection('matches').doc(roomId);
                const matchDoc = await matchRef.get();
                if (!matchDoc.exists) {
                    return res.status(404).json({ success: false, message: "Match not found" });
                }

                const matchData = matchDoc.data();
                let updateData = {};

                if (matchData.host.deviceId === deviceId) {
                    updateData['host.confirmed'] = true;
                } else if (matchData.joiner.deviceId === deviceId) {
                    updateData['joiner.confirmed'] = true;
                } else {
                    return res.status(403).json({ success: false, message: "Unauthorized" });
                }

                await matchRef.update(updateData);
                return res.status(200).json({ success: true, message: "Successfully confirmed" });
            }

            // 🌟 Match ဖျက်သိမ်းခြင်း (Cancel)
            if (action === 'cancel') {
                const { roomId } = data;
                if (!roomId) {
                    return res.status(400).json({ success: false, message: "Room ID is required" });
                }

                await db.collection('matches').doc(roomId).delete();
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
            if (data.heroName) dbData.heroName = data.heroName;
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