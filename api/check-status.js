// api/check-status.js
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Service Account ကို သေချာစစ်ဆေးပါ
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

module.exports = async (req, res) => {
    // req.body ကို သုံးလို့မရပါ (GET request မို့လို့)
    // req.query ကို သုံးရပါမယ်
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
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null
        });
    } catch (err) {
        console.error("Firebase Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
};