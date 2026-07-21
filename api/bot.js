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

// Confirm လုပ်ရင် Status ပြောင်းခြင်း နှင့် Key ဖန်တီးခြင်း
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    try {
        // ၁။ registrations ထဲက Data ကို အရင်ဖတ်မယ် (Entry Fee ယူဖို့အတွက်)
        const regRef = db.collection("registrations").doc(docId);
        const regDoc = await regRef.get();

        if (!regDoc.exists) {
            return ctx.answerCbQuery("Error: Registration အချက်အလက် မရှိပါ။");
        }

        const regData = regDoc.data();
        const deviceId = regData.deviceId; // user ရဲ့ deviceId
        const rawFee = regData.entryFee;   // ဥပမာ: "Entry Fee: 50000 Ks" သို့မဟုတ် "5000"

        // Entry Fee စာသားထဲက ကိန်းဂဏန်းကို ဖြတ်ထုတ်ခြင်း (ဥပမာ 5000 သို့မဟုတ် 10000)
        const feeNumber = parseInt(rawFee.replace(/[^0-9]/g, '')) || 5000;

        // ၂။ Firebase Status ကို confirm လို့ ပြောင်းမယ်
        await regRef.update({ status: "confirm" });

        // ၃။ User အတွက် Key တစ်ချောင်းကို active ဖြစ်အောင် ဖန်တီးပေးမယ် (သို့မဟုတ် users collection ထဲ ထည့်မယ်)
        const now = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Yangon',
            day: '2-digit', month: '2-digit', year: 'numeric',       
            hour: '2-digit', minute: '2-digit', hour12: true
        }).format(now);

        // deviceId ကို doc ID အဖြစ် သုံးပြီး active key ကို သိမ်းဆည်းမည်
        if (deviceId) {
            await db.collection("users").doc(deviceId).set({
                activeKey: {
                    tier: feeNumber,          // ယူထားတဲ့ Key တန်ဖိုး (ဥပမာ 5000)
                    status: 'active',         // 'active' သို့မဟုတ် 'in-use'
                    roomId: null,
                    activatedAt: formattedDate // အချိန် field
                }
            }, { merge: true });
        }
        
        // ၄။ Telegram Message ပြင်မယ်
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed & Key Activated", { parse_mode: "HTML" });
        await ctx.answerCbQuery("အောင်မြင်စွာ Confirmed လုပ်ပြီး Key ထည့်သွင်းလိုက်ပါပြီ");
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
