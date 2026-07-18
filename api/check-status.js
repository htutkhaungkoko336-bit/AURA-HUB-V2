const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

module.exports = async (req, res) => {
    // Database ထဲက docId နဲ့ ရှာမယ်
    const docId = req.query.deviceId; 

    if (!docId) {
        return res.status(400).json({ error: "Missing docId" });
    }

    try {
        const docRef = db.collection("registrations").doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ status: "not_found" });
        }

        const data = doc.data();
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null
        });
    } catch (err) {
        return res.status(500).json({ error: "Server Error", details: err.message });
    }
};