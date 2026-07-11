import { getFirestore } from 'firebase-admin/firestore';
import { handleTelegramCallback } from './bot.js';

const db = getFirestore();

export default async function handler(req, res) {
    if (req.body.callback_query) {
        const { data, message } = req.body.callback_query;
        const [action, regId] = data.split('_');

        if (action === 'confirm' || action === 'reject') {
            // Firebase Status ပြောင်းခြင်း
            await db.collection('registrations').doc(regId).update({
                status: action === 'confirm' ? 'Confirmed' : 'Rejected'
            });

            // Telegram message ကို ပြင်ပေးခြင်း
            await handleTelegramCallback(req.body.callback_query);
        }
    }
    res.status(200).send('OK');
}