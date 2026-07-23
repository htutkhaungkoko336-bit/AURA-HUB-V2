// Server side: /api/room-detail handler
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 ? initializeApp({ 
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) 
}) : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        const { roomId } = req.query;
        if (!roomId) return res.status(400).json({ success: false, message: "Room ID လိုအပ်ပါသည်။" });

        const roomDoc = await db.collection('rooms').doc(roomId).get();
        if (!roomDoc.exists) return res.status(404).json({ success: false, message: "Room မတွေ့ရှိပါ။" });

        const roomData = roomDoc.data();

        // registrations collection မှ host data ကို ထပ်ဆွဲရန်
        const regSnapshot = await db.collection('registrations')
            .where('deviceId', '==', roomData.hostDeviceId)
            .get();

        let regData = {};
        if (!regSnapshot.empty) {
            regData = regSnapshot.docs[0].data();
        }

        const responseData = {
            mode: roomData.mode || '5vs5',
            logo: regData.logo || roomData.logo || 'default-logo.png',
            squadName: regData.squadName || 'N/A',
            playerName: regData.playerName || regData.squadName || 'N/A',
            heroName: regData.heroName || 'N/A',
            leaderPhone: regData.kpayNo || regData.leaderPhone || roomData.leaderPhone || 'မပါရှိပါ။'
        };

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error("Detail Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};