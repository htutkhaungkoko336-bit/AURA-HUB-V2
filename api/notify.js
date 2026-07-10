import axios from 'axios';

export async function notify(type, data, regId) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // ၁။ Group ID များကို Environment Variable မှယူခြင်း
    const groupIds = {
        'REGISTRATION': process.env.TELEGRAM_REG_GROUP_ID,
        'REFUND': process.env.TELEGRAM_REFUND_GROUP_ID,
        'APPROVAL': process.env.TELEGRAM_APPROVER_GROUP_ID
    };

    const targetChatId = groupIds[type];
    if (!targetChatId) return; // မရှိရင် ဘာမှမလုပ်ဘူး

    // ၂။ Message ပုံစံဖော်ခြင်း (Markdown)
    const regMessage = `🔔 *New ${type} Request!*\n\n` +
                       `🎮 *Mode:* ${data.mode || 'N/A'}\n` +
                       `👤 *Squad/Player:* ${data.squadName || data.playerName || 'Unknown'}\n` +
                       `🖼️ [View Payment Proof](${data.paymentURL || data.paymentScreenshot || '#'})\n\n` +
                       `🆔 *Reg ID:* ${regId}`;

    // ၃။ Admin Action (Inline Keyboard) - Registration အတွက်ပဲ ထည့်မယ်
    let reply_markup = {};
    if (type === 'REGISTRATION') {
        reply_markup = {
            inline_keyboard: [[
                { text: '✅ Confirm', callback_data: `regConfirm_${regId}` },
                { text: '❌ Reject', callback_data: `regReject_${regId}` }
            ]]
        };
    }

    // ၄။ Telegram API ကို ပို့ဆောင်ခြင်း
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: targetChatId,
        text: regMessage,
        parse_mode: 'Markdown',
        reply_markup: reply_markup
    });

    // ၅။ Admin တွေကို Private အကြောင်းကြားခြင်း
    const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
    for (const adminId of adminIds) {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: adminId,
            text: `🚨 *Admin Alert:* New ${type} request! (Reg ID: ${regId})`,
            parse_mode: 'Markdown'
        });
    }
}