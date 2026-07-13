export async function sendMessage(chatId, message, replyMarkup = null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    // အကယ်၍ replyMarkup ပါလာပါက body ထဲသို့ ထည့်ပေးခြင်း
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }

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
// Confirm ခလုတ်ကို နှိပ်လိုက်သည့်အခါ အလုပ်လုပ်ပါမည်
bot.action(/confirm_(.+)/, async (ctx) => {
    // ခလုတ်ထဲက ID (data.id) ကို ရယူခြင်း
    const docId = ctx.match[1]; 
    
    try {
        // Firebase Firestore ထဲက Data ကို ရှာပြီး update လုပ်ခြင်း
        // သင့်ရဲ့ Collection နာမည်ကို 'registrations' ဟု ယူဆပါတယ်
        await db.collection("registrations").doc(docId).update({
            status: "confirm"
        });

        // User ကို Feedback ပြန်ပေးခြင်း (Button ကို အောင်မြင်ကြောင်း ပြောင်းပြခြင်း)
        await ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ <b>Status:</b> Confirmed", {
            parse_mode: 'HTML'
        });

        ctx.answerCbQuery("အောင်မြင်စွာ အတည်ပြုလိုက်ပါပြီ။");
    } catch (error) {
        console.error("Error updating status: ", error);
        ctx.answerCbQuery("❌ Error: အတည်ပြု၍ မရပါ။");
    }
});