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
    const docId = req.query.deviceId;
    
    // Log 1: docId ရ/မရ စစ်ပါ
    console.log("Checking status for docId:", docId);

    if (!docId) {
        return res.status(400).json({ error: "Missing docId" });
    }

    try {
        const docRef = db.collection("registrations").doc(docId);
        const doc = await docRef.get();

        // Log 2: Firebase က data တွေ့/မတွေ့ စစ်ပါ
        if (!doc.exists) {
            console.log("Document does not exist for:", docId);
            return res.status(404).json({ status: "not_found" });
        }

        const data = doc.data();
        console.log("Data found:", data); // Log 3: အချက်အလက်များ
        
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null
        });
    } catch (err) {
        console.error("Firebase Error:", err); // Log 4: Error ဘာလဲဆိုတာကြည့်ပါ
        return res.status(500).json({ error: "Server Error", details: err.message });
    }
};