// Server side: /api/room-detail-playing handler (Combined with ready & cancel actions)
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    try {
        // 1. GET Request: Room အသေးစိတ်အချက်အလက်များကို ဆွဲထုတ်ရန်
        if (req.method === 'GET') {
            const { roomId } = req.query;
            if (!roomId) return res.status(400).json({ success: false, message: "Room ID လိုအပ်ပါသည်။" });

            // 'rooms' အစား 'matches' collection ကို သုံးရန်
            const roomDoc = await db.collection('matches').doc(roomId).get();
            if (!roomDoc.exists) return res.status(404).json({ success: false, message: "Room မတွေ့ရှိပါ။" });

            const roomData = roomDoc.data();
            const mode = roomData.mode || '5vs5';

            let hostRegData = {};
            const hostDeviceId = roomData.host?.deviceId || roomData.hostDeviceId;
            if (hostDeviceId) {
                const hostSnap = await db.collection('registrations').where('deviceId', '==', hostDeviceId).get();
                if (!hostSnap.empty) hostRegData = hostSnap.docs[0].data();
            }

            let joinerRegData = {};
            const joinerDeviceId = roomData.joiner?.deviceId || roomData.joinerDeviceId;
            if (joinerDeviceId) {
                const joinerSnap = await db.collection('registrations').where('deviceId', '==', joinerDeviceId).get();
                if (!joinerSnap.empty) joinerRegData = joinerSnap.docs[0].data();
            }

            function extractPlayers(regSource, roomSource) {
                let list = [];
                for (let i = 1; i <= 5; i++) {
                    let p = regSource[`player${i}`] || roomSource[`player${i}`] || roomSource.players?.[i - 1];
                    if (p) {
                        let pName = (typeof p === 'object' && p !== null) ? (p.name || p.playerName || 'N/A') : p;
                        list.push(pName);
                    } else {
                        list.push('N/A');
                    }
                }
                return list;
            }

            let hostInfo = {
                deviceId: hostDeviceId || roomData.host?.deviceId || '',
                isReady: roomData.host?.isReady || false,
                logo: hostRegData.logo || roomData.host?.logo || roomData.logo || 'default-logo.png',
                contact: hostRegData.kpayNo || hostRegData.leaderPhone || hostRegData.contact || roomData.host?.leaderPhone || roomData.host?.contact || roomData.leaderPhone || '-',
                players: extractPlayers(hostRegData, roomData.host || {})
            };

            if (mode === '1vs1') {
                hostInfo.playerName = hostRegData.playerName || roomData.host?.playerName || roomData.hostName || 'N/A';
                hostInfo.heroName = hostRegData.heroName || roomData.host?.heroName || 'N/A';
            } else {
                hostInfo.squadName = hostRegData.squadName || roomData.host?.squadName || 'Team A';
            }

            let joinerInfo = {
                deviceId: joinerDeviceId || roomData.joiner?.deviceId || '',
                isReady: roomData.joiner?.isReady || false,
                logo: joinerRegData.logo || roomData.joiner?.logo || 'default-logo.png',
                contact: joinerRegData.kpayNo || joinerRegData.leaderPhone || joinerRegData.contact || roomData.joiner?.leaderPhone || roomData.joiner?.contact || '-',
                players: extractPlayers(joinerRegData, roomData.joiner || {})
            };

            if (mode === '1vs1') {
                joinerInfo.playerName = joinerRegData.playerName || roomData.joiner?.playerName || 'Waiting...';
                joinerInfo.heroName = joinerRegData.heroName || roomData.joiner?.heroName || 'Waiting...';
            } else {
                joinerInfo.squadName = joinerRegData.squadName || roomData.joiner?.squadName || 'Team B';
            }

            let responseData = {
                mode: mode,
                entryFee: roomData.entryFee,
                host: hostInfo,
                joiner: joinerInfo
            };

            return res.status(200).json({ success: true, data: responseData });
        }

        // 2. POST Request: Ready လုပ်ခြင်း (သို့မဟုတ်) Cancel လုပ်ခြင်း
        if (req.method === 'POST') {
            const { roomId, deviceId, action } = req.body;
            if (!roomId || !deviceId) {
                return res.status(400).json({ success: false, message: "Room ID နှင့် Device ID လိုအပ်ပါသည်။" });
            }

            // 'rooms' အစား 'matches' collection ကို သုံးရန်
            const roomRef = db.collection('matches').doc(roomId);
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) return res.status(404).json({ success: false, message: "Room not found" });

            const roomData = roomDoc.data();
            const isAuthorized = (roomData.host?.deviceId === deviceId || roomData.joiner?.deviceId === deviceId);

            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            // အကယ်၍ Action က cancel ဆိုလျှင် Room ကိုဖျက်မည်
            if (action === 'cancel') {
                await roomRef.delete();
                return res.status(200).json({ success: true, message: "Room cancelled successfully" });
            }

            // မဟုတ်ပါက Default အနေဖြင့် Ready Status ကို ပြောင်းလဲပေးမည်
            let updateData = {};
            if (roomData.host?.deviceId === deviceId) {
                let currentReady = roomData.host?.isReady || false;
                updateData['host.isReady'] = !currentReady;
            } else if (roomData.joiner?.deviceId === deviceId) {
                let currentReady = roomData.joiner?.isReady || false;
                updateData['joiner.isReady'] = !currentReady;
            }

            await roomRef.update(updateData);
            return res.status(200).json({ success: true });
        }

        return res.status(405).end();
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};