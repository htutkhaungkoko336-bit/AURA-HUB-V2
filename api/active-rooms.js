const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    try {
        // 🌟 Frontend က ပို့လိုက်သော mode ကို ဖမ်းယူခြင်း (မပါလာပါက 5vs5 ဟု ယူမည်)
        const requestedMode = req.query.mode || '5vs5';

        // 🌟 Firestore query တွင် mode ပါ ထည့်သွင်းစစ်ဆေးခြင်း
        const roomsSnapshot = await db.collection('rooms')
            .where('status', '==', 'waiting')
            .where('mode', '==', requestedMode) // <-- ဤနေရာတွင် Mode အလိုက် Filter လုပ်ပါ
            .get();

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
                mode: regData.mode || roomData.mode || requestedMode,
                entryFee: regData.entryFee || roomData.entryFee || '0',
                status: roomData.status
            });
        }

        return res.status(200).json({ success: true, rooms: roomList });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};