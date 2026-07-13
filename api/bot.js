const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialize (အရင်က အောင်မြင်ခဲ့တဲ့ ပုံစံအတိုင်း)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Firebase Init Error:", e);
    }
}
const db = admin.firestore();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// --- အဓိက အလုပ်လုပ်မယ့် Action ---
bot.action(/confirm_(.+)/, async (ctx) => {
    console.log("✅ Confirm button clicked");
    console.log("Doc ID:", ctx.match[1]);

    const docId = ctx.match[1].trim();

    try {
        await db.collection("registrations").doc(docId).update({
            status: "confirm"
        });

        console.log("Firestore updated");

        await ctx.editMessageText(
            ctx.callbackQuery.message.text +
            "\n\n✅ <b>Status:</b> Confirmed",
            { parse_mode: "HTML" }
        );

        await ctx.answerCbQuery("Success");

    } catch (err) {
        console.error(err);
    }
});
// Vercel Serverless Handler
module.exports = async (req, res) => {
    try {
        // Telegram ကလာတဲ့ update ကို bot ကိုပို့ပေးခြင်း
        await bot.handleUpdate(req.body);
        return res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).send('Error');
    }
};