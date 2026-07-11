import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { handleTelegramCallback } from './bot.js';

// Firebase Initialize
const firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = !getApps().length ? initializeApp({ credential: cert(firebaseConfig) }) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const body = req.body;

    // Telegram က ပို့လာတဲ့ callback_query ကို စစ်ခြင်း
    if (body.callback_query) {
        const callbackQuery = body.callback_query;
        const data = callbackQuery.data; // ဥပမာ: "confirm_12345"
        const [action, regId] = data.split('_');

        try {
            if (action === 'confirm' || action === 'reject') {
                const newStatus = action === 'confirm' ? 'Confirmed' : 'Rejected';

                // Firebase Update လုပ်ခြင်း
                await db.collection('registrations').doc(regId).update({
                    status: newStatus
                });

                // Telegram Message ကို ပြင်ရန် bot.js ထဲက function ကို ခေါ်ခြင်း
                await handleTelegramCallback(callbackQuery);
            }
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Firebase Update Error:", error);
            return res.status(500).json({ error: "Failed to update" });
        }
    }

    res.status(200).send('OK');
}