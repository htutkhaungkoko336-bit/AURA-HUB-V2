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
    
    if (!deviceId) {
        return res.status(400).json({ error: "Missing deviceId" });
    }

    try {
        // deviceId နဲ့ တူတဲ့ registration ကို ရှာမယ်
        const snapshot = await db.collection("registrations")
                                 .where("deviceId", "==", deviceId)
                                 .get();
        
        if (snapshot.empty) {
            return res.status(200).json({ status: "none" });
        }
        
        // နောက်ဆုံးဝင်ထားတဲ့ data ကို ယူမယ်
        const data = snapshot.docs[0].data();
        
        // Frontend ကို status နဲ့ reason ပြန်ပို့မယ်
        res.status(200).json({ 
            status: data.status || "pending", 
            rejectReason: data.rejectReason || "No reason provided" 
        });
        
    } catch (err) {
        console.error("Error checking status:", err);
        res.status(500).json({ error: "Database error" });
    }
};