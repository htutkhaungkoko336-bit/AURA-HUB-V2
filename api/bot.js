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

// Confirm လုပ်ရင် Status ပြောင်းခြင်း နှင့် သီးသန့် Collection ထဲသို့ Key ဖန်တီးခြင်း
bot.action(/confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    try {
        const regRef = db.collection("registrations").doc(docId);
        const regDoc = await regRef.get();

        if (!regDoc.exists) {
            return ctx.answerCbQuery("Error: Registration အချက်အလက် မရှိပါ။");
        }

        const regData = regDoc.data();
        const deviceId = regData.deviceId; 
        const rawFee = regData.entryFee;   

        if (!deviceId) {
            return ctx.answerCbQuery("Error: Device ID မတွေ့ရှိပါ။");
        }

        const feeNumber = parseInt(rawFee.replace(/[^0-9]/g, '')) || 5000;

        await regRef.update({ status: "confirm" });

        const now = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Yangon',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        }).format(now);

        await db.collection("userKeys").doc(deviceId).set({
            deviceId: deviceId,
            keyTier: feeNumber,          
            status: 'active',            
            roomId: null,                
            activatedAt: formattedDate   
        });
        
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed & Key Activated", { parse_mode: "HTML" });
        await ctx.answerCbQuery("အောင်မြင်စွာ Confirmed လုပ်ပြီး Key သီးသန့်ထည့်သွင်းလိုက်ပါပြီ");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Error: Database အမှားအယွင်း");
    }
});

// Reject ခလုတ်နှိပ်လျှင် အကြောင်းရင်းများ ပြပေးခြင်း
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

// အကြောင်းရင်းကို ရွေးချယ်ပြီးမှ Database ကို Update လုပ်ခြင်း
bot.action(/reason_(.+)_(.+)/, async (ctx) => {
    const reasonKey = ctx.match[1]; 
    const docId = ctx.match[2];
    
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

// Admin မှ Refund ငွေလွှဲပြီးကြောင်း Confirm လုပ်သည့်အခါ (Key အသစ် မထွက်စေဘဲ Status သာ Completed ပြောင်းရန်)
bot.action(/refund_btn_confirm_(.+)/, async (ctx) => {
    const docId = ctx.match[1];
    try {
        const regRef = db.collection("registrations").doc(docId);
        const regDoc = await regRef.get();

        if (!regDoc.exists) {
            return ctx.answerCbQuery("Error: Registration အချက်အလက် မရှိပါ။");
        }

        // Registrations ထဲတွင် refundStatus ကို completed သို့ ပြောင်းခြင်း
        await regRef.update({ 
            refundStatus: "completed" 
        });
        
        // Telegram မက်ဆေ့ဂျ်ကို Status ပြောင်းလဲကြောင်း Edit လုပ်ခြင်း
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n💰 <b>Refund Status:</b> ငွေလွှဲပြီးစီးပါပြီ (Completed)", { parse_mode: "HTML" });
        await ctx.answerCbQuery("Refund ငွေလွှဲပြီးကြောင်း အောင်မြင်စွာ မှတ်တမ်းတင်လိုက်ပါပြီ။");
    } catch (err) {
        console.error("Refund Confirm Error:", err);
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