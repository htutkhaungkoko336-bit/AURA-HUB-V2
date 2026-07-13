const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// ၁။ Bot ကို Initialize လုပ်ခြင်း
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ၂။ Firebase ကို Initialize လုပ်ခြင်း
let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
    console.error("Firebase Service Account JSON မှားနေပါသည်");
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// ... (sendMessage function နှင့် bot.action များ ထားခဲ့ပါ) ...// ၃။ သင့် sendMessage function
export async function sendMessage(chatId, message, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = { chat_id: chatId, text: message, parse_mode: 'HTML', reply_markup: replyMarkup };

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

// ၄။ Bot Action များ (ယခင်အတိုင်း)
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1]; 
    try {
        await db.collection("registrations").doc(docId).update({ status: "confirm" });
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed", { parse_mode: 'HTML' });
        ctx.answerCbQuery("အောင်မြင်စွာ အတည်ပြုလိုက်ပါပြီ။");
    } catch (error) {
        console.error("Error updating status: ", error);
        ctx.answerCbQuery("❌ Error: အတည်ပြု၍ မရပါ။");
    }
});

module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body, res);
        return res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).send('Error');
    }
};