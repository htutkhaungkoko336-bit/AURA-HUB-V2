const admin = require('firebase-admin');

// Firebase Initialize (အသေချာဆုံးနည်း)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    const docId = req.query.id;
    if (!docId) return res.status(400).json({ status: "error", message: "Missing ID" });

    try {
        const doc = await db.collection("registrations").doc(docId).get();
        
        if (doc.exists && doc.data().status === "confirm") {
            return res.status(200).json({ status: "confirm" });
        }
        return res.status(200).json({ status: "pending" });
    } catch (err) {
        console.error("Status Check Error:", err);
        return res.status(500).json({ status: "error", message: err.message });
    }
};