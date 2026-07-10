import { sendMessage } from './bot';

export async function notify(type, data) {
    let message = `<b>🔔 New ${type} Received</b>\n\n`;

    // Mode ခွဲပြီး Message Format ရေးခြင်း
    if (data.mode === '5vs5') {
        message += `<b>Mode:</b> 5vs5\n` +
                   `<b>Squad Name:</b> ${data.squadName}\n` +
                   `<b>K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>K-Pay No:</b> ${data.kpayNo}\n` +
                   `<b>Status:</b> Pending`;
    } else if (data.mode === '1vs1') {
        message += `<b>Mode:</b> 1vs1\n` +
                   `<b>Player Name:</b> ${data.playerName || data.squadName}\n` + // 1vs1 အတွက်နာမည်
                   `<b>MLBB ID:</b> ${data.mlbbId}\n` +
                   `<b>Hero Name:</b> ${data.heroName}\n` +
                   `<b>Status:</b> Pending`;
    } else {
        // Mode မသေချာရင် default အနေနဲ့ပြပေးမယ်
        message += `<b>Info:</b> ${JSON.stringify(data)}`;
    }

    // Group ID တွေ
    const groupIds = {
        'REGISTRATION': process.env.TELEGRAM_REG_GROUP_ID,
        'REFUND': process.env.TELEGRAM_REFUND_GROUP_ID,
        'APPROVAL': process.env.TELEGRAM_APPROVER_GROUP_ID
    };

    // သက်ဆိုင်ရာ Group ကို ပို့မယ်
    const targetChatId = groupIds[type];
    if (targetChatId) await sendMessage(targetChatId, message);

    // Admin တွေကိုလည်း အကြောင်းကြားမယ်
    const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
    for (const adminId of adminIds) {
        const adminMsg = `🚨 <b>Admin Alert:</b> New ${type} request!\n<b>Mode:</b> ${data.mode}\n<b>Name:</b> ${data.squadName || data.playerName}`;
        await sendMessage(adminId, adminMsg);
    }
}