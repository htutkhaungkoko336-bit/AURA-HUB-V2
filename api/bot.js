const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Firebase Initialize လုပ်ခြင်း
let db;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    if (!admin.apps || admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();
} catch (e) {
    console.error("Firebase Initialize Error:", e);
}

// သင့် sendMessage function
async function sendMessage(chatId, message, replyMarkup = null) {
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

// Bot Action များ
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

// Vercel Webhook Handler
module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body, res);
        return res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).send('Error');
    }
};