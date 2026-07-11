import { getFirestore, doc, updateDoc } from 'firebase-admin/firestore';

// Firebase Database ချိတ်ဆက်ခြင်း
const db = getFirestore();

// ၁။ စာပို့ရန် function
export async function sendMessage(chatId, message, keyboard = null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

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

// ၂။ စာပြင်ရန် function
export async function editMessageText(chatId, messageId, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: chatId, 
                message_id: messageId, 
                text: text, 
                parse_mode: 'HTML' 
            })
        });
    } catch (error) {
        console.error("Edit Message Error:", error);
    }
}

// ၃။ Callback (ခလုတ်နှိပ်ချက်) ကို ကိုင်တွယ်ရန် function
export async function handleTelegramCallback(callbackQuery) {
    const data = callbackQuery.data; // ဥပမာ - "confirm_12345"
    const [action, regId] = data.split('_');
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    try {
        if (action === 'confirm') {
            // Firebase ထဲမှာ status ပြောင်းခြင်း
            await updateDoc(doc(db, 'registrations', regId), { status: 'Confirmed' });
            // Telegram ထဲက message ကို ပြင်ခြင်း
            await editMessageText(chatId, messageId, "✅ Confirmed");
        } else if (action === 'reject') {
            await updateDoc(doc(db, 'registrations', regId), { status: 'Rejected' });
            await editMessageText(chatId, messageId, "❌ Rejected");
        }
    } catch (error) {
        console.error("Callback Handle Error:", error);
    }
}