const { Telegraf } = require("telegraf");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Firebase Initialize
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = getFirestore();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Confirm Button
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1].trim();

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
module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};