const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const { action, deviceId, teamName, logo, mlbbId, playerName, mode, entryFee } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, message: "Device ID မတွေ့ရှိပါ။" });
        }

        try {
            // Refund Action ရောက်လာသည့်အခါ
            if (action === 'refund') {
                // Device ID နဲ့ တိုက်ဆိုင်တဲ့ registration စာရွက်စာတမ်းအားလုံးကို ရှာမည်
                const regSnapshot = await db.collection('registrations').where('deviceId', '==', deviceId).get();

                if (regSnapshot.empty) {
                    return res.status(404).json({ success: false, message: "Registration အချက်အလက် မတွေ့ရှိပါ။" });
                }

                // အသစ်ဆုံး Registration စာရွက်စာတမ်းကို ရယူရန် (သို့မဟုတ် ပထမဆုံးတွေ့တာကို ယူရန်)
                const regDoc = regSnapshot.docs[0];
                const docId = regDoc.id; // တိကျတဲ့ Document ID ကို ယူခြင်း
                const regData = regDoc.data();

                // ၁။ တွေ့ရှိတဲ့ သက်ဆိုင်ရာ Document ကို တိုက်ရိုက် update လုပ်ခြင်း
                await db.collection('registrations').doc(docId).update({
                    refundStatus: 'pending', 
                    refundRequestedAt: new Date().toISOString()
                });

                // ၂။ userKeys ထဲမှ Key ကို ဖျက်ခြင်း
                await db.collection('userKeys').doc(deviceId).delete();

                // ၃။ Refund Group ဆီသို့ Telegram Noti ပို့ခြင်း (docId ကို callback_data ထဲမှာ တိကျစွာ ထည့်မည်)
                const botToken = process.env.TELEGRAM_BOT_TOKEN;
                const refundGroupId = process.env.TELEGRAM_REFUND_GROUP_ID;

                if (botToken && refundGroupId) {
                    const message = `🚨 <b>Refund တောင်းဆိုမှု အသစ်!</b>\n\n` +
                                    `👤 Player: ${regData.playerName || 'Unknown'}\n` +
                                    `🎮 MLBB ID: ${regData.mlbbId || 'N/A'}\n` +
                                    `💰 KPay Ph No: ${regData.contact || regData.kpayPhone || regData.kpayNo || 'N/A'}\n` +
                                    `💵 Amount: ${regData.entryFee || 'N/A'}\n` +
                                    `📌 Status: Pending (ငွေလွှဲရန်လိုသည်)`;

                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: refundGroupId,
                            text: message,
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: "💰 Refund ငွေလွှဲပြီးပြီ (Confirm)", callback_data: `refund_confirm_${docId}` }]
                                ]
                            }
                        })
                    });
                }

                return res.status(200).json({ 
                    success: true, 
                    message: "Refund တောင်းဆိုမှု အောင်မြင်ပါသည်။ Admin ထံသို့ အကြောင်းကြားပြီးပါပြီ။" 
                });
            }

            // ၂။ ROOM ဖန်တီးခြင်း လုပ်ငန်းစဉ် (Default)
            const keysQuery = await db.collection('userKeys').where('deviceId', '==', deviceId).get();

            if (keysQuery.empty) {
                return res.status(403).json({ 
                    success: false, 
                    message: "သင့်တွင် အသုံးပြုနိုင်သော Key မရှိသေးပါ။ ကျေးဇူးပြု၍ Key အရင်ဝယ်ယူပါ။" 
                });
            }

            const keyDoc = keysQuery.docs[0];
            const keyRef = keyDoc.ref; 
            const keyData = keyDoc.data();

            if (keyData.status !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: "သင့် Key မှာ လက်ရှိ Room တစ်ခုခုတွင် အသုံးပြုနေပြီးသား (သို့မဟုတ်) အသုံးမပြုနိုင်သော အနေအထားတွင် ရှိနေပါသည်။" 
                });
            }

            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Yangon',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).format(now);

            const roomRef = await db.collection('rooms').add({
                hostDeviceId: deviceId,
                teamName: teamName || "My Team",
                logo: logo || "",
                mlbbId: mlbbId || "",
                playerName: playerName || "",
                mode: mode || "1vs1",
                entryFee: entryFee || keyData.keyTier,
                status: 'waiting',
                createdAt: formattedDate
            });

            const roomId = roomRef.id;

            await keyRef.update({
                status: 'in-use',
                roomId: roomId
            });

            return res.status(200).json({ 
                success: true, 
                message: "Room အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။",
                roomId: roomId 
            });

        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
};