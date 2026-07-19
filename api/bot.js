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
// ၁။ Reject ခလုတ်နှိပ်လျှင် အကြောင်းရင်းများ ပြပေးခြင်း
bot.action(/reject_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n⚠️ Reject လုပ်ရမည့်အကြောင်းရင်းကို ရွေးချယ်ပါ:", {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "Entry Fee ကြေးမလောက်ခြင်း", callback_data: `reason_low_fee_${docId}` }],
                [{ text: "Player Name/ID မှားယွင်းခြင်း", callback_data: `reason_wrong_player_${docId}` }],
                [{ text: "K-Pay အချက်အလက်မှားယွင်း", callback_data: `reason_wrong_kpay_${docId}` }],
                [{ text: "ညစ်ညမ်းသောပုံတင်ခြင်း", callback_data: `reason_inappropriate_${docId}` }]
            ]
        }
    });
});
// ၂။ အကြောင်းရင်းကို ရွေးချယ်ပြီးမှ Database ကို Update လုပ်ခြင်း
bot.action(/reason_(.+)_(.+)/, async (ctx) => {
    const reasonKey = ctx.match[1]; // ဥပမာ: low_fee, wrong_player
    const docId = ctx.match[2];
    
    // Reason ကို မြန်မာလို ပြောင်းလဲခြင်း (Mapping အသစ်)
    const reasonMap = {
        'low_fee': "Entry Fee ကြေးမလောက်ခြင်း",
        'wrong_player': "Player Name/ID မှားယွင်းခြင်း",
        'wrong_kpay': "K-Pay အချက်အလက်မှားယွင်းခြင်း",
        'inappropriate': "ညစ်ညမ်းသောပုံတင်ခြင်း"
    };

    const reasonText = reasonMap[reasonKey] || "အကြောင်းရင်းမဖော်ပြထားပါ";

    try {
        await db.collection("registrations").doc(docId).update({ 
            status: "reject",
            rejectReason: reasonText 
        });
        
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ <b>Status:</b> Rejected\n⚠️ <b>Reason:</b> ${reasonText}`, { parse_mode: "HTML" });
        await ctx.answerCbQuery("Rejected လုပ်ပြီး အကြောင်းရင်းကို သိမ်းဆည်းလိုက်ပါပြီ");
    } catch (err) {
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
