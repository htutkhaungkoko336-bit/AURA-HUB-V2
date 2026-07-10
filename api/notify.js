import { sendMessage } from './bot';

export async function notify(type, data) {
    let message = `<b>🔔 New ${type} Received</b>\n\n`;

    const entryFeeString = data.entryFee || "0"; 
    const fee = parseInt(entryFeeString.replace(/[^0-9]/g, '')) || 0;
    const matchFormat = (fee >= 25000) ? "BO3 (Best of 3)" : "BO1 (Best of 1)";

    if (data.mode === '5vs5') {
        message += `<b>Mode:</b> 5vs5\n` +
                   `<b>Format:</b> ${matchFormat}\n` +
                   `<b>Squad Name:</b> ${data.squadName}\n` +
                   `<b>Entry Fee:</b> ${fee} Ks\n` +
                   `<b>K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>K-Pay No:</b> ${data.kpayNo}\n` +
                   `<b>Players:</b>\n` +
                   `1. ${data.player1}\n2. ${data.player2}\n` +
                   `3. ${data.player3}\n4. ${data.player4}\n5. ${data.player5}\n` +
                   `<b>Logo:</b> ${data.logo || 'N/A'}\n` +
                   `<b>Payment Slip:</b> ${data.paymentScreenshot || 'N/A'}`;
                   
    } else if (data.mode === '1vs1') {
        message += `<b>Mode:</b> 1vs1\n` +
                   `<b>Format:</b> ${matchFormat}\n` +
                   `<b>Player Name:</b> ${data.playerName || data.squadName}\n` +
                   `<b>Entry Fee:</b> ${fee} Ks\n` +
                   `<b>MLBB ID:</b> ${data.mlbbId}\n` +
                   `<b>Hero Name:</b> ${data.heroName}\n` +
                   `<b>K-Pay Name:</b> ${data.kpayName}\n` +
                   `<b>K-Pay No:</b> ${data.kpayNo}\n` +
                   `<b>Payment Slip:</b> ${data.paymentScreenshot || 'N/A'}`;
    }
    
    message += `\n\n<b>Status:</b> Pending`;

    // Group ID Logic
    const groupIds = {
        'REGISTRATION': process.env.TELEGRAM_REG_GROUP_ID,
        'REFUND': process.env.TELEGRAM_REFUND_GROUP_ID,
        'APPROVAL': process.env.TELEGRAM_APPROVER_GROUP_ID
    };

    const targetChatId = groupIds[type];
    if (targetChatId) await sendMessage(targetChatId, message);

    // Admin Alert
    const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
    for (const adminId of adminIds) {
        const adminMsg = `🚨 <b>Admin Alert:</b> ${data.mode} | ${matchFormat}\n<b>Name:</b> ${data.squadName || data.playerName}`;
        await sendMessage(adminId, adminMsg);
    }
}