// api/check-status.js
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Firebase ကို ခေါ်ယူခြင်း
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

module.exports = async (req, res) => {
    const { deviceId } = req.query;
    if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

    try {
        const snapshot = await db.collection("registrations").where("deviceId", "==", deviceId).get();
        
        if (snapshot.empty) return res.status(404).json({ status: "none" });
        
        // နောက်ဆုံးတင်ထားတဲ့ Registration ကို ယူမယ်
        const data = snapshot.docs[0].data();
        res.status(200).json({ 
            status: data.status, 
            rejectReason: data.rejectReason || "No reason provided" 
        });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
};