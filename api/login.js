const admin = require('firebase-admin');

// Firebase Initialization
const initializeApp = () => {
    if (!admin.apps.length) {
        try {
            // Vercel Environment Variable ကို string အနေနဲ့ အရင်ယူ၊ ပြီးမှ parse လုပ်ပါ
            const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
            
            if (!serviceAccountRaw) {
                throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
            }

            const serviceAccount = JSON.parse(serviceAccountRaw);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase initialized successfully.");
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            throw error; // Error ကို အပေါ်အဆင့်ထိ ပို့ပေးပါ
        }
    }
};

// Database ကို Initialize လုပ်ပါ
initializeApp();
const db = admin.firestore();

export default async function handler(req, res) {
    try {
        const snapshot = await db.collection('users').get();
        return res.status(200).json({ 
            status: 'Success', 
            count: snapshot.size 
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
            status: 'Error', 
            message: error.message 
        });
    }
}