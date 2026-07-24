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
        const roomsSnapshot = await db.collection('rooms').where('status', '==', 'waiting').get();
        let roomList = [];

        for (const doc of roomsSnapshot.docs) {
            let roomData = doc.data();
            
            // registrations collection ထဲမှ hostDeviceId နဲ့ ကိုက်ညီတဲ့ ဒေတာ ယူရန်
            const regSnapshot = await db.collection('registrations')
                .where('deviceId', '==', roomData.hostDeviceId)
                .get();

            let regData = {};
            if (!regSnapshot.empty) {
                regData = regSnapshot.docs[0].data();
            }

            // 🌟 5vs5 နှင့် 1vs1 နှစ်ခုစလုံးအတွက် လိုအပ်သော အချက်အလက်များ ထည့်သွင်းခြင်း
            roomList.push({
                roomId: doc.id,
                deviceId: roomData.hostDeviceId,
                logo: regData.logo || roomData.logo || '',
                squadName: regData.squadName || roomData.teamName || 'My Team',
                heroName: regData.heroName || roomData.heroName || '', // 1vs1 အတွက် heroName
                playerName: regData.playerName || roomData.playerName || '',
                mode: roomData.mode || '5vs5',
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