// api/check-status.js
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Service Account ကို သေချာစစ်ဆေးပါ
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// api/check-status.js ကို ဒီအတိုင်း ပြင်ရေးပါ
module.exports = async (req, res) => {
    const deviceId = req.query.deviceId; // URL ကလာတဲ့ parameter
    
    if (!deviceId) {
        return res.status(400).json({ error: "Missing deviceId" });
    }

    try {
        // ID နဲ့ တိုက်ရိုက်မရှာဘဲ Field ကို filter လုပ်ပြီး ရှာပါ
        const snapshot = await db.collection("registrations")
                                 .where("deviceId", "==", deviceId)
                                 .get();

        if (snapshot.empty) {
            console.log("ဒီ deviceId နဲ့ ဘာမှမတွေ့ဘူး:", deviceId);
            return res.status(404).json({ status: "not_found" });
        }

        // နောက်ဆုံး Register လုပ်ထားတဲ့ Data ကို ယူမယ်
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        return res.status(200).json({
            status: data.status,
            rejectReason: data.rejectReason || null
        });
    } catch (err) {
        console.error("Firebase Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
};