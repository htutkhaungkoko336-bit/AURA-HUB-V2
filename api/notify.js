import { sendMessage } from './bot';

export async function notify(type, data) {
    let message = `<b>🔔 New ${type} Received</b>\n\n`;

    // Fee ကို ကြည့်ပြီး BO1/BO3 သတ်မှတ်ခြင်း
    const fee = parseInt(data.entryFee) || 0;
    const matchFormat = (fee >= 25000) ? "BO3 (Best of 3)" : "BO1 (Best of 1)";

    // Mode ခွဲပြီး Message Format ရေးခြင်း
    if (data.mode === '5vs5') {
        message += `<b>Mode:</b> 5vs5\n` +
                   `<b>Format:</b> ${matchFormat}\n` +
                   `<b>Squad Name:</b> ${data.squadName}\n` +
                   `<b>Entry Fee:</b> ${fee} Ks\n` +
                   `<b>K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>K-Pay No:</b> ${data.kpayNo}\n`;
    } else if (data.mode === '1vs1') {
        message += `<b>Mode:</b> 1vs1\n` +
                   `<b>Format:</b> ${matchFormat}\n` +
                   `<b>Player Name:</b> ${data.playerName || data.squadName}\n` +
                   `<b>Entry Fee:</b> ${fee} Ks\n` +
                   `<b>MLBB ID:</b> ${data.mlbbId}\n` +
                   `<b>Hero Name:</b> ${data.heroName}\n`;
    }
    
    message += `\n<b>Status:</b> Pending`;

    // Group ID တွေ
    const groupIds = {
        'REGISTRATION': process.env.TELEGRAM_REG_GROUP_ID,
        'REFUND': process.env.TELEGRAM_REFUND_GROUP_ID,
        'APPROVAL': process.env.TELEGRAM_APPROVER_GROUP_ID
    };

    const targetChatId = groupIds[type];
    if (targetChatId) await sendMessage(targetChatId, message);

    // Admin တွေဆီ ပို့မယ့် Message မှာလည်း Format ပါအောင်လုပ်မယ်
    const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
    for (const adminId of adminIds) {
        const adminMsg = `🚨 <b>Admin Alert:</b> ${data.mode} | ${matchFormat} | <b>Fee:</b> ${fee}\n<b>Name:</b> ${data.squadName || data.playerName}`;
        await sendMessage(adminId, adminMsg);
    }
}