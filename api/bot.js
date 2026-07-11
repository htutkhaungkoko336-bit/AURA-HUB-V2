import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Initialize လုပ်ခြင်း
const firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = !getApps().length ? initializeApp({ credential: cert(firebaseConfig) }) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
    // Webhook အတွက် POST request ကို စောင့်ဆိုင်းခြင်း
    if (req.method === 'POST') {
        const body = req.body;

        // ၁။ Telegram Callback (Confirm/Reject နှိပ်ခြင်း) ကို စစ်ဆေးခြင်း
        if (body.callback_query) {
            const { data, message } = body.callback_query;
            const [action, regId] = data.split('_');

            try {
                if (action === 'confirm' || action === 'reject') {
                    const newStatus = action === 'confirm' ? 'Confirmed' : 'Rejected';

                    // Firebase Update လုပ်ခြင်း
                    await db.collection('registrations').doc(regId).update({
                        status: newStatus
                    });

                    // Telegram Message ကို ပြင်ပေးခြင်း
                    await editMessage(message.chat.id, message.message_id, `<b>Status:</b> ${newStatus}`);
                }
            } catch (error) {
                console.error("Error processing callback:", error);
            }
        }
        return res.status(200).send('OK');
    }

    // တခြား GET requests များအတွက် 405 ပြန်ပေးရန်
    return res.status(405).end();
}

// Telegram သို့ Message ပို့ရန် Function
export async function sendMessage(chatId, message, keyboard = null) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        console.error("Telegram Bot Error:", error);
    }
}

// Telegram Message ပြင်ရန် Function
async function editMessage(chatId, messageId, newText) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: newText,
            parse_mode: 'HTML'
        })
    });
}