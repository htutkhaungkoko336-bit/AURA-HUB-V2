const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    try {
        const { roomId, deviceId, action, status } = req.method === 'POST' ? req.body : req.query;

        if (!roomId) return res.status(400).json({ success: false, message: "Room ID လိုအပ်ပါသည်။" });

        let matchRef = db.collection('rooms').doc(roomId);
        let matchDoc = await matchRef.get();
        
        if (!matchDoc.exists) {
            return res.status(404).json({ success: false, message: "Room မတွေ့ရှိပါ။" });
        }

        const roomData = matchDoc.data();

        if (req.method === 'POST') {
            let hostDevId = roomData.host?.deviceId || roomData.hostDeviceId;
            let joinerDevId = roomData.joiner?.deviceId || roomData.joinerDeviceId;

            if (action === 'ready') {
                let updateData = {};
                if (hostDevId === deviceId) {
                    updateData['host.confirmed'] = status;
                } else if (joinerDevId === deviceId) {
                    updateData['joiner.confirmed'] = status;
                } else {
                    return res.status(403).json({ success: false, message: "ခွင့်ပြုချက်မရှိပါ။" });
                }

                await matchRef.update(updateData);
                return res.status(200).json({ success: true, message: "Updated successfully" });
            }

            if (action === 'cancel') {
                if (hostDevId === deviceId || joinerDevId === deviceId) {
                    // Host ဖြစ်စေ၊ Joiner ဖြစ်စေ cancel လုပ်ရင် Room တစ်ခုလုံးကို ဖျက်ပစ်မည်
                    await matchRef.delete();

                    // Room ထဲမှာ ပါဝင်နေတဲ့ Host နဲ့ Joiner နှစ်ဦးစလုံးရဲ့ Key (userKeys) နဲ့ registrations များကို active ပြန်လုပ်မည်
                    const deviceIdsToReset = [hostDevId, joinerDevId].filter(Boolean);
                    
                    for (const devId of deviceIdsToReset) {
                        // 1. registrations status ကို active ပြန်ပြောင်းရန်
                        const regSnap = await db.collection('registrations').where('deviceId', '==', devId).get();
                        if (!regSnap.empty) {
                            await regSnap.docs[0].ref.update({ 
                                status: 'active', 
                                currentRoomId: null 
                            });
                        }

                        // 2. userKeys ထဲက key status ကို active ပြန်ပြောင်းပြီး roomId ကို ဖြုတ်ရန်
                        const keySnap = await db.collection('userKeys').doc(devId).collection('userKeys').where('roomId', '==', roomId).get();
                        if (!keySnap.empty) {
                            for (const keyDoc of keySnap.docs) {
                                await keyDoc.ref.update({
                                    status: 'active',
                                    roomId: null
                                });
                            }
                        }
                    }

                    return res.status(200).json({ success: true, message: "Match cancelled, room deleted and keys are now active." });
                } else {
                    return res.status(403).json({ success: false, message: "ဖျက်ရန် ခွင့်ပြုချက်မရှိပါ။" });
                }
            }

            return res.status(400).json({ success: false, message: "Invalid action" });
        }

        // 🌟 GET Method (Detail အချက်အလက်များ)
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
            let sourcePlayers = roomSource.players || regSource.players;
            
            for (let i = 1; i <= 5; i++) {
                let p = regSource[`player${i}`] || roomSource[`player${i}`] || (Array.isArray(sourcePlayers) ? sourcePlayers[i - 1] : null);
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
            confirmed: roomData.host?.confirmed || false,
            players: extractPlayers(hostRegData, roomData.host || {})
        };

        if (mode === '1vs1') {
            hostInfo.playerName = hostRegData.playerName || roomData.host?.playerName || roomData.host?.playerName || 'N/A';
            hostInfo.heroName = hostRegData.heroName || roomData.host?.heroName || 'N/A';
        } else {
            hostInfo.squadName = hostRegData.squadName || roomData.host?.squadName || roomData.host?.teamName || 'Team A';
        }

        let joinerInfo = {
            deviceId: joinerDeviceId || roomData.joiner?.deviceId || '',
            logo: joinerRegData.logo || roomData.joiner?.logo || 'default-logo.png',
            contact: joinerRegData.kpayNo || joinerRegData.leaderPhone || joinerRegData.contact || roomData.joiner?.leaderPhone || roomData.joiner?.contact || '-',
            confirmed: joinerRegData.confirmed || roomData.joiner?.confirmed || false,
            players: extractPlayers(joinerRegData, roomData.joiner || {})
        };

        if (mode === '1vs1') {
            joinerInfo.playerName = joinerRegData.playerName || roomData.joiner?.playerName || 'Waiting...';
            joinerInfo.heroName = joinerRegData.heroName || roomData.joiner?.heroName || 'Waiting...';
        } else {
            joinerInfo.squadName = joinerRegData.squadName || roomData.joiner?.squadName || roomData.joiner?.teamName || 'Team B';
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
};