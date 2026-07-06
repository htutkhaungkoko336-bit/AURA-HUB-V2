const admin = require('firebase-admin');

// Firebase ကို တစ်ကြိမ်သာ Initialize လုပ်ကြောင်း သေချာစေခြင်း
if (!admin.apps.length) {
    try {
        // Environment variable ကို တိုက်ရိုက် parse လုပ်ပါ
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase App Initialized");
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

// Global scope မှာ db ကို define လုပ်ပါ
const db = admin.firestore();

export default async function handler(req, res) {
    try {
        // Data ကို စမ်းသပ်ဆွဲထုတ်ကြည့်ပါ
        const snapshot = await db.collection('users').get();
        return res.status(200).json({ 
            status: 'Success', 
            count: snapshot.size 
        });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ 
            status: 'Error', 
            message: error.message 
        });
    }
}