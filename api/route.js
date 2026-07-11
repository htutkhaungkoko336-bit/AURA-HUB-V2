import { NextResponse } from 'next/server';
import { db } from '../lib/firebaseAdmin'; // Firebase Admin ကို import လုပ်ပါ

export async function POST(req) {
  const update = await req.json();

  if (update.callback_query) {
    const { id, data, message } = update.callback_query;
    const [action, recordId] = data.split('_'); 

    // Firebase Firestore တွင် Status Update လုပ်ခြင်း
    try {
      // 'registrations' သည် သင်၏ collection name ဖြစ်ရပါမည်
      await db.collection('registrations').doc(recordId).update({
        status: action === 'confirm' ? 'Confirmed' : 'Rejected',
        updatedAt: new Date()
      });

      // Telegram Message ပြင်ခြင်း
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
    } catch (error) {
      console.error("Firebase Update Error:", error);
    }

    // Loading spinner ကို ပိတ်ပေးရန်
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id })
    });
  }

  return NextResponse.json({ ok: true });
}