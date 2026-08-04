const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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
                if (hostDevId === deviceId) {
                    // Host cancel ရင် Room တစ်ခုလုံး ပျက်မည်၊ Host ရဲ့ key/status ကိုပါ active ပြန်လုပ်ပေးရန်
                    await matchRef.delete();
                    
                    // ဥပမာ: registrations collection ထဲတွင် status ကို active ပြန်ပြောင်းလိုပါက (သို့မဟုတ် room status များကို reset လုပ်လိုပါက)
                    const regSnap = await db.collection('registrations').where('deviceId', '==', deviceId).get();
                    if (!regSnap.empty) {
                        await regSnap.docs[0].ref.update({ status: 'active', currentRoomId: null });
                    }

                    return res.status(200).json({ success: true, message: "Match cancelled and room deleted" });

                } else if (joinerDevId === deviceId) {
                    // Joiner cancel ရင် joiner data ဖျက်ပြီး room ကို waiting ပြန်ပြောင်းမည်
                    await matchRef.update({
                        joiner: FieldValue.delete(),
                        status: 'waiting'
                    });

                    // Joiner ရဲ့ key/status ကို active ပြန်လုပ်ပေးရန်
                    const joinerRegSnap = await db.collection('registrations').where('deviceId', '==', deviceId).get();
                    if (!joinerRegSnap.empty) {
                        await joinerRegSnap.docs[0].ref.update({ status: 'active', currentRoomId: null });
                    }

                    return res.status(200).json({ success: true, message: "Joiner cancelled, room is now waiting" });
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
            hostInfo.playerName = hostRegData.playerName || roomData.host?.playerName || roomData.playerName || 'N/A';
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