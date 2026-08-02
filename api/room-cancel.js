// /api/room-cancel.js
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { roomId, deviceId } = req.body;
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();
        if (!roomDoc.exists) return res.status(404).json({ success: false, message: "Room not found" });

        const roomData = roomDoc.data();
        if (roomData.host?.deviceId === deviceId || roomData.joiner?.deviceId === deviceId) {
            await roomRef.delete(); // Room ကို ဖျက်မည် (သို့မဟုတ် status ကို cancelled လို့ပြောင်းနိုင်သည်)
            return res.status(200).json({ success: true });
        }
        return res.status(403).json({ success: false, message: "Unauthorized" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};