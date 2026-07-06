const admin = require('firebase-admin');

// Firebase ကို တစ်ခါပဲ Initialize လုပ်ဖို့ စစ်ဆေးခြင်း
if (!admin.apps.length) {
    try {
        // Vercel Environment Variable ထဲက JSON ကို ပုံမှန်အတိုင်း ခေါ်ယူခြင်း
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        // Database ကို စမ်းသပ်ခြင်း
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return res.status(200).json({ 
            status: 'Success', 
            count: users.length,
            data: users 
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
            status: 'Error', 
            message: error.message 
        });
    }
}