// /api/room-ready.js
const { getFirestore } = require('firebase-admin/firestore');
// (Firebase app initialization ပုံမှန်အတိုင်း ထည့်ပါ)

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { roomId, deviceId } = req.body;
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();
        if (!roomDoc.exists) return res.status(404).json({ success: false, message: "Room not found" });

        const roomData = roomDoc.data();
        let updateData = {};

        if (roomData.host?.deviceId === deviceId) {
            let currentReady = roomData.host?.isReady || false;
            updateData['host.isReady'] = !currentReady;
        } else if (roomData.joiner?.deviceId === deviceId) {
            let currentReady = roomData.joiner?.isReady || false;
            updateData['joiner.isReady'] = !currentReady;
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await roomRef.update(updateData);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};