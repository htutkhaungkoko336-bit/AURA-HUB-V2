export async function sendMessage(chatId, message, reply_markup = null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };
    
    // ခလုတ်ထည့်ရန်
    if (reply_markup) {
        body.reply_markup = JSON.stringify(reply_markup);
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
// Webhook ထဲတွင် handle လုပ်ရန်
if (update.callback_query) {
    const data = update.callback_query.data; // ဥပမာ: "regConfirm_12345"
    const [action, regId] = data.split('_');
    const chatId = update.callback_query.message.chat.id;

    if (action === 'regConfirm') {
        // Firebase Status ပြောင်းခြင်း
        await db.collection("registrations").doc(regId).update({ status: 'confirm' });
        
        // အတည်ပြုကြောင်း ပြန်ပြောခြင်း
        await sendMessage(chatId, "✅ Registration အတည်ပြုပြီးပါပြီ။");
        // ခလုတ်ကို ဖျောက်ခြင်း
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
            method: 'POST',
            body: JSON.stringify({ chat_id: chatId, message_id: update.callback_query.message.message_id, reply_markup: null })
        });
    } else if (action === 'regReject') {
        await db.collection("registrations").doc(regId).update({ status: 'rejected' });
        await sendMessage(chatId, "❌ Registration ပယ်ချလိုက်ပါပြီ။");
    }
}