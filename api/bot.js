const { Telegraf } = require("telegraf");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = getFirestore();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Telegram Send Message Helper
async function sendMessage(chatId, text, replyMarkup = null) {
    return bot.telegram.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: replyMarkup
    });
}

// Confirm Button
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];

    try {
        await db.collection("registrations").doc(docId).update({
            status: "confirm"
        });

        await ctx.editMessageText(
            ctx.callbackQuery.message.text +
            "\n\n✅ <b>Status:</b> Confirmed",
            { parse_mode: "HTML" }
        );

        await ctx.answerCbQuery("Confirmed");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Error");
    }
});

// Webhook
async function webhook(req, res) {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
}

module.exports = {
    sendMessage,
    webhook
};