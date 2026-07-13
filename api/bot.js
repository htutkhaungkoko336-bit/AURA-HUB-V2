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

// Confirm Button Action
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    try {
        await db.collection("registrations").doc(docId).update({
            status: "confirm"
        });
        await ctx.editMessageText(
            ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed",
            { parse_mode: "HTML" }
        );
        await ctx.answerCbQuery("Confirmed");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Error");
    }
});

// Vercel အတွက် Default Export (Function တစ်ခုတည်း ဖြစ်ရမယ်)
module.exports = async (req, res) => {
    try {
        // Telegram ကနေ လာတဲ့ request တွေကို handle လုပ်မယ်
        await bot.handleUpdate(req.body);
        return res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error");
    }
};

// sendMessage ကို တခြားနေရာက သုံးချင်ရင် ဒီလို export ထပ်လုပ်လို့မရပါ (Vercel Error တက်မယ်)
// ဒါကြောင့် sendMessage ကို ဒီဖိုင်ထဲမှာပဲ လိုအပ်ရင် သုံးပါ