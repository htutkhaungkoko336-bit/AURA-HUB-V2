// api/check-status.js
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Service Account ကို သေချာစစ်ဆေးပါ
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// api/register.js အပိုင်း
module.exports = async (req, res) => {
    const { deviceId, ...payload } = req.body;

    try {
        // ၁။ deviceId နဲ့ တူတဲ့ Document ရှိမရှိ ရှာပါ
        const snapshot = await db.collection("registrations")
                                 .where("deviceId", "==", deviceId)
                                 .get();

        if (!snapshot.empty) {
            // ၂။ Document ရှိနေရင် အဲ့ဒီ Document ID ကိုပဲ သုံးပြီး update လုပ်ပါ
            const docId = snapshot.docs[0].id;
            await db.collection("registrations").doc(docId).update({
                ...payload,
                status: 'pending', // ပြင်ပြီးရင် status ကို ပြန်တင်ပေးမယ်
                updatedAt: new Date().toLocaleString()
            });
            return res.status(200).json({ success: true, message: "Updated existing registration" });
        } else {
            // ၃။ Document မရှိမှ အသစ်တစ်ခု ဆောက်ပါ
            await db.collection("registrations").add({
                deviceId,
                ...payload,
                status: 'pending',
                createdAt: new Date().toLocaleString()
            });
            return res.status(200).json({ success: true, message: "New registration created" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};