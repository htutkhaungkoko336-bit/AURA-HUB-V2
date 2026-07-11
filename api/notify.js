// notify.js
// အရေးကြီး: ./bot လို့မရေးဘဲ ./bot.js လို့ ရေးပေးရပါမယ်
import { sendMessage } from './bot.js';

export async function notify(type, data, registrationId) {
    let message = `<b>🔔 New ${type} Received</b>\n\n`;

    const entryFeeString = data.entryFee || "0"; 
    const fee = parseInt(entryFeeString.replace(/[^0-9]/g, '')) || 0;
    const matchFormat = (fee >= 25000) ? "BO3 (Best of 3)" : "BO1 (Best of 1)";

    // Message Body တည်ဆောက်ခြင်း
    if (data.mode === '5vs5') {
        const getP = (p) => (p ? `${p.name} (ID: ${p.id})` : "N/A");
        message += `<b>🎮 Mode:</b> 5vs5\n` +
                   `<b>💰 Entry Fee:</b> ${fee} Ks\n` +
                   `<b>⚔️ Format:</b> ${matchFormat}\n` +
                   `<b>🛡️ Squad Name:</b> ${data.squadName}\n` +
                   `<b>👥 Players:</b>\n` +
                   `1. ${getP(data.player1)}\n2. ${getP(data.player2)}\n` +
                   `3. ${getP(data.player3)}\n4. ${getP(data.player4)}\n5. ${getP(data.player5)}\n` +
                   `<b>💳 K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>📱 K-Pay No:</b> ${data.kpayNo}\n` +
                   `<b>🖼️ Payment Slip:</b> ${data.paymentScreenshot || 'N/A'}\n` +
                   `<b>🎨 Squad Logo:</b> ${data.logo || 'N/A'}\n`;
    } else if (data.mode === '1vs1') {
        message += `<b>🎮 Mode:</b> 1vs1\n` +
                   `<b>💰 Entry Fee:</b> ${fee} Ks\n` +
                   `<b>⚔️ Format:</b> ${matchFormat}\n` +
                   `<b>👤 Player Name:</b> ${data.playerName || data.squadName}\n` +
                   `<b>🆔 MLBB ID:</b> ${data.mlbbId}\n` +
                   `<b>🦸 Hero Name:</b> ${data.heroName}\n` +
                   `<b>💳 K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>📱 K-Pay No:</b> ${data.kpayNo}\n` +
                   `<b>🖼️ Payment Slip:</b> ${data.paymentScreenshot || 'N/A'}\n` +
                   `<b>🎨 Logo:</b> ${data.logo || 'N/A'}\n`;
    }
    message += `\n\n<b>Status:</b> Pending`;

    // Inline Keyboard တည်ဆောက်ခြင်း
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Confirm", callback_data: `confirm_${registrationId}` },
                { text: "❌ Reject", callback_data: `reject_${registrationId}` }
            ]
        ]
    };

    // Group ID များ (Environment Variable များ အလုပ်လုပ်ကြောင်း သေချာစေပါ)
    const groupIds = {
        'REGISTRATION': process.env.TELEGRAM_REG_GROUP_ID,
        'REFUND': process.env.TELEGRAM_REFUND_GROUP_ID,
        'APPROVAL': process.env.TELEGRAM_APPROVER_GROUP_ID
    };

    // Main Registration Group သို့ Message ပို့ခြင်း
    const targetChatId = groupIds[type];
    if (targetChatId) {
        await sendMessage(targetChatId, message, keyboard);
    } else {
        console.error(`Group ID not found for type: ${type}`);
    }

    // Admin Alert
    const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
    for (const adminId of adminIds) {
        const adminMsg = `🚨 <b>Admin Alert:</b> ${data.mode} | ${matchFormat}\n<b>Name:</b> ${data.squadName || data.playerName}`;
        await sendMessage(adminId, adminMsg);
    }
}