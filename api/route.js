import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 

export async function POST(req) {
  try {
    const update = await req.json();
    console.log("Received Update:", JSON.stringify(update)); // Webhook ရောက်လာတာကို အရင်စစ်မယ်

    if (update.callback_query) {
      const { id, data, message } = update.callback_query;
      console.log("Callback Data:", data); // confirm_... ပါမပါ စစ်မယ်
      
      const [action, docId] = data.split('_'); 
      console.log("Action:", action, "DocID:", docId);

      // ၁။ Firebase တွင် ရှာဖွေခြင်း
      const querySnapshot = await db.collection('registrations')
                                    .where('docId', '==', docId)
                                    .get();

      if (querySnapshot.empty) {
        console.error("❌ Error: No registration found with docId:", docId);
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      // ၂။ Update လုပ်ခြင်း
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update({
        status: action === 'confirm' ? 'Confirmed' : 'Rejected',
        updatedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon' })
      });
      console.log("✅ Firebase Updated successfully");

      // ၃။ Telegram Message ပြင်ခြင်း
      const statusText = action === 'confirm' ? "✅ <b>Status:</b> Confirmed" : "❌ <b>Status:</b> Rejected";
      
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chat.id,
          message_id: message.message_id,
          text: message.text.replace('Status: Pending', statusText),
          parse_mode: 'HTML'
        })
      });

      const resData = await res.json();
      if (!resData.ok) {
        console.error("❌ Telegram API Error:", resData.description);
      }
    }

    // ၄။ Loading spinner ပိတ်ရန်
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: update.callback_query?.id })
    });

  } catch (error) {
    console.error("🔥 Webhook Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}