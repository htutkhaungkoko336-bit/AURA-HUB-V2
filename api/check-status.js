const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Initialize (အရင်ကအတိုင်း)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

module.exports = async (req, res) => {
    const docId = req.query.id;
    if (!docId) return res.status(400).json({ error: "Missing docId" });
    
    try {
        const doc = await db.collection("registrations").doc(docId).get();
        if (doc.exists && doc.data().status === "confirm") {
            return res.status(200).json({ status: "confirm" });
        }
        return res.status(200).json({ status: "pending" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};