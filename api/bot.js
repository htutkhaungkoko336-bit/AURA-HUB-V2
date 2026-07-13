// ၁။ လိုအပ်တာတွေကို Import လုပ်ပါ (Telegraf နဲ့ Firebase DB)
const { Telegraf } = require('telegraf');
// သင့် project မှာ firebase ကို ဘယ်လို import လုပ်ထားလဲ အဲ့အတိုင်း ပြန်သုံးပါ
const { db } = require('./firebaseConfig'); // ဥပမာဖိုင်နာမည်

// ၂။ Bot ကို Initialize လုပ်ပါ
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ၃။ သင့် sendMessage function
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

// ၅။ အရေးကြီးဆုံးအချက် - Vercel မှာ Webhook ကို အလုပ်လုပ်စေရန်
// Vercel က serverless ဖြစ်လို့ bot.launch() မသုံးပါနဲ့။ 
// bot ကို export လုပ်ပေးလိုက်ပါ။
module.exports = bot;