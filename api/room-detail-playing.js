const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    // 1. GET Request (ပွဲစဉ်အချက်အလက်များနှင့် Player/Team ဒေတာများ ဆွဲထုတ်ရန်)
    if (req.method === 'GET') {
        try {
            const { roomId } = req.query;
            if (!roomId) return res.status(400).json({ success: false, message: "Room ID လိုအပ်ပါသည်။" });

            const roomDoc = await db.collection('rooms').doc(roomId).get();
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
                logo: hostRegData.logo || roomData.host?.logo || roomData.logo || 'default-logo.png',
                contact: hostRegData.kpayNo || hostRegData.leaderPhone || hostRegData.contact || roomData.host?.leaderPhone || roomData.host?.contact || roomData.leaderPhone || '-',
                players: extractPlayers(hostRegData, roomData.host || {}),
                confirmed: roomData.host?.confirmed || false
            };

            if (mode === '1vs1') {
                hostInfo.playerName = hostRegData.playerName || roomData.host?.playerName || roomData.playerName || 'N/A';
                hostInfo.heroName = hostRegData.heroName || roomData.host?.heroName || 'N/A';
            } else {
                hostInfo.squadName = hostRegData.squadName || roomData.host?.squadName || 'Team A';
            }

            let joinerInfo = {
                deviceId: joinerDeviceId || roomData.joiner?.deviceId || '',
                logo: joinerRegData.logo || roomData.joiner?.logo || 'default-logo.png',
                contact: joinerRegData.kpayNo || joinerRegData.leaderPhone || joinerRegData.contact || roomData.joiner?.leaderPhone || roomData.joiner?.contact || '-',
                players: extractPlayers(joinerRegData, roomData.joiner || {}),
                confirmed: roomData.joiner?.confirmed || false
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
        } catch (error) {
            console.error("Playing Detail Error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // 2. POST Request (Ready/Unready ပြုလုပ်ခြင်း နှင့် Match ဖျက်သိမ်းခြင်း)
    if (req.method === 'POST') {
        try {
            const { roomId, deviceId, action, status } = req.body;
            if (!roomId || !deviceId) {
                return res.status(400).json({ success: false, message: "Invalid parameters" });
            }

            const roomRef = db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                return res.status(404).json({ success: false, message: "Room မတွေ့ပါ။" });
            }

            const roomData = roomDoc.data();
            const isHost = roomData.host?.deviceId === deviceId;
            const isJoiner = roomData.joiner?.deviceId === deviceId;

            if (!isHost && !isJoiner) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }

            if (action === 'ready') {
                let updateField = isHost ? { 'host.confirmed': status } : { 'joiner.confirmed': status };
                await roomRef.update(updateField);
                return res.status(200).json({ success: true });
            } 
            
            if (action === 'cancel') {
                await roomRef.delete();
                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ success: false, message: "Unknown action" });
        } catch (error) {
            console.error("Action Error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).end();
};