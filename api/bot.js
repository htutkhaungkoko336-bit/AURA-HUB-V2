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

// Confirm လုပ်ရင် Status ပြောင်းခြင်း
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    try {
        // Firebase Status ပြောင်းမယ်
        await db.collection("registrations").doc(docId).update({ status: "confirm" });
        
        // Message ပြင်မယ်
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed", { parse_mode: "HTML" });
        await ctx.answerCbQuery("အောင်မြင်စွာ Confirmed လုပ်လိုက်ပါပြီ");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Error: Database အမှားအယွင်း");
    }
});

module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        return res.status(200).send("OK");
    } catch (err) {
        return res.status(500).send("Error");
    }
};