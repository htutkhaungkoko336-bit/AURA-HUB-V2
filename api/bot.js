// bot.js ထဲတွင်
export async function sendMessage(chatId, message, keyboard = null) { // keyboard ကို option အနေနဲ့ ထည့်ပေးပါ
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    // keyboard ပါလာရင် body ထဲထည့်ပေးမယ်
    if (keyboard) {
        body.reply_markup = keyboard;
    }

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
export async function handleTelegramCallback(callbackQuery) {
    const data = callbackQuery.data; // "confirm_12345"
    const [action, regId] = data.split('_');
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    if (action === 'confirm') {
        await editMessageText(chatId, messageId, "✅ Confirmed");
    } else if (action === 'reject') {
        await editMessageText(chatId, messageId, "❌ Rejected");
    }
}
export async function editMessageText(chatId, messageId, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: text, parse_mode: 'HTML' })
    });
}
// bot.js ထဲတွင်
import { getFirestore, doc, updateDoc } from 'firebase-admin/firestore';
const db = getFirestore();

// ... handleTelegramCallback ထဲမှာ
if (action === 'confirm') {
    await updateDoc(doc(db, 'registrations', regId), { status: 'Confirmed' }); // Firebase update
    await editMessageText(chatId, messageId, "✅ Confirmed"); // Telegram msg update
}