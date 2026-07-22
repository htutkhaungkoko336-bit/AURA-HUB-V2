// api/check-status.js
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

module.exports = async (req, res) => {
    const deviceId = req.query.deviceId; 

    console.log("Checking status for deviceId:", deviceId);

    if (!deviceId) {
        return res.status(400).json({ error: "Missing deviceId" });
    }

    try {
        const snapshot = await db.collection("registrations")
                                     .where("deviceId", "==", deviceId)
                                     .get();

        if (snapshot.empty) {
            return res.status(404).json({ status: "not_found" });
        }

        const data = snapshot.docs[0].data();

        // userKeys collection ထဲမှ room/key အခြေအနေကို စစ်ဆေးမည်
        const keyDocRef = db.collection("userKeys").doc(deviceId);
        const keyDoc = await keyDocRef.get();
        
        let keyStatus = 'active';
        let roomId = null;
        let hasActiveRoom = false;

        if (keyDoc.exists) {
            const keyData = keyDoc.data();
            keyStatus = keyData.status || 'active'; 
            roomId = keyData.roomId || null;
            hasActiveRoom = (keyStatus === 'in-use' && Boolean(roomId));
        }

        // Response ထဲသို့ keyTier ပါ ထည့်သွင်းပေးခြင်း
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null,
            keyStatus: keyStatus,
            roomId: roomId,
            hasActiveRoom: hasActiveRoom,
            keyTier: keyDoc.exists ? (keyDoc.data().keyTier || 0) : 0
        });

    } catch (err) {
        console.error("Firebase Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
};