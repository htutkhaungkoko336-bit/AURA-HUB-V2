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

        // registrations collection မှ host data ကို ဆွဲရန်
        const regSnapshot = await db.collection('registrations')
            .where('deviceId', '==', roomData.hostDeviceId)
            .get();

        let regData = {};
        if (!regSnapshot.empty) {
            regData = regSnapshot.docs[0].data();
        }

        const mode = roomData.mode || '5vs5';
        let responseData = {
            mode: mode,
            logo: regData.logo || roomData.logo || 'default-logo.png',
            leaderPhone: regData.kpayNo || regData.leaderPhone || roomData.leaderPhone || 'မပါရှိပါ။'
        };

        if (mode === '1vs1') {
            responseData.playerName = regData.playerName || roomData.playerName || 'N/A';
            responseData.heroName = regData.heroName || roomData.heroName || 'N/A';
        } else {
            // 5vs5 အတွက် Squad Name နှင့် Player ၅ ယောက်စာ နာမည်များ (array သို့မဟုတ် string ဖြင့် သိမ်းထားသည်များကို ယူမည်)
            responseData.squadName = regData.squadName || roomData.squadName || 'N/A';
            responseData.players = regData.players || roomData.players || [
                regData.player1 || 'Player 1',
                regData.player2 || 'Player 2',
                regData.player3 || 'Player 3',
                regData.player4 || 'Player 4',
                regData.player5 || 'Player 5'
            ];
        }

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error("Detail Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};