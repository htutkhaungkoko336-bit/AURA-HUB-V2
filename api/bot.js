export async function sendMessage(chatId, message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Telegram Bot Error:", error);
    }
}
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