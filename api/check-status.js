const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Firebase Initialization
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

// Vercel/Serverless API Handler
module.exports = async (req, res) => {
    const deviceId = req.query.deviceId;

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
        
        // Frontend ကို Response ပြန်ပေးခြင်း
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null
        });
    } catch (err) {
        return res.status(500).json({ error: "Server Error", details: err.message });
    }
};