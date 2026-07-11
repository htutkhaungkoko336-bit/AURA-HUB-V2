import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 

export async function POST(req) {
  const update = await req.json();

  if (update.callback_query) {
    const { id, data, message } = update.callback_query;
    // data ဥပမာ: confirm_docId123
    const [action, docId] = data.split('_'); 

    try {
      // ၁။ docId ကို အသုံးပြုပြီး Firebase ထဲက record ကို ရှာဖွေခြင်း
      const querySnapshot = await db.collection('registrations')
                                    .where('docId', '==', docId)
                                    .get();

      if (!querySnapshot.empty) {
        // ၂။ ရှာတွေ့သော record ကို update လုပ်ခြင်း
        const docRef = querySnapshot.docs[0].ref;
        await docRef.update({
          status: action === 'confirm' ? 'Confirmed' : 'Rejected',
          updatedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon' })
        });

        // ၃။ Telegram Message ပြင်ခြင်း (Confirmed/Rejected ဟု ပြောင်းရန်)
        const statusText = action === 'confirm' 
          ? `✅ <b>Status:</b> Confirmed` 
          : `❌ <b>Status:</b> Rejected`;

        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: message.chat.id,
            message_id: message.message_id,
            text: message.text.replace('Status: Pending', statusText),
            parse_mode: 'HTML'
          })
        });
      }
    } catch (error) {
      console.error("Webhook Update Error:", error);
    }

    // ၄။ Loading spinner ပိတ်ရန်
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id })
    });
  }

  return NextResponse.json({ ok: true });
}

