import { Telegraf } from 'telegraf';
import admin from 'firebase-admin';

// Firebase ကို Initialize လုပ်ခြင်း
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Telegram ကနေ Confirm ခလုတ်နှိပ်ရင် လုပ်ဆောင်မည့် အပိုင်း
bot.action(/regConfirm_(.+)/, async (ctx) => {
    const regId = ctx.match[1]; // regId ကို ခလုတ်ကနေ ရယူ
    try {
        // Firebase ကို တိုက်ရိုက် update လုပ်ခြင်း
        await db.collection("registrations").doc(regId).update({ status: 'confirm' });
        await ctx.editMessageText("✅ အောင်မြင်စွာ Confirm လုပ်ပြီးပါပြီ။");
    } catch (error) {
        await ctx.answerCbQuery("❌ Error: Firebase update မအောင်မြင်ပါ။");
    }
});

// Reject လုပ်ရင်
bot.action(/regReject_(.+)/, async (ctx) => {
    const regId = ctx.match[1];
    await db.collection("registrations").doc(regId).update({ status: 'rejected' });
    await ctx.editMessageText("❌ ပယ်ချလိုက်ပါပြီ။");
});

// Vercel Serverless Function အဖြစ် export လုပ်ခြင်း
export default async function handler(req, res) {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        return res.status(200).send('OK');
    }
    return res.status(200).send('Bot is active');
}