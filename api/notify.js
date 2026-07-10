import { sendMessage } from './bot';

export async function notify(type, data) {
    // ပို့ရမယ့် Message ပုံစံ
    const message = `<b>🔔 New Registration Received</b>\n\n` +
                    `<b>Squad Name:</b> ${data.squadName}\n` +
                    `<b>K-Pay Name:</b> ${data.kpayName}\n` +
                    `<b>K-Pay No:</b> ${data.kpayNo}\n` +
                    `<b>Status:</b> Pending`;

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
    const adminIds = process.env.ADMINS.split(',');
    for (const adminId of adminIds) {
        await sendMessage(adminId, `🚨 Admin Alert: ${type} request for ${data.squadName}`);
    }
}