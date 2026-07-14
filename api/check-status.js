const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    // ပုံမှန်အားဖြင့် JSON သာ ပြန်ပို့ပါမည်
    res.setHeader('Content-Type', 'application/json');

    const docId = req.query.id;
    if (!docId) {
        return res.status(400).json({ status: "error", message: "Missing ID" });
    }

    try {
        const doc = await db.collection("registrations").doc(docId).get();
        
        if (doc.exists && doc.data().status === "confirm") {
            return res.status(200).json({ status: "confirm" });
        }
        return res.status(200).json({ status: "pending" });
    } catch (err) {
        // Error တက်လျှင်လည်း status: "pending" သို့မဟုတ် error ဟု ပို့ပေးပါ (Crash မဖြစ်စေရ)
        return res.status(200).json({ status: "pending", error: "Database unreachable" });
    }
};