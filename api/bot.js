export async function sendMessage(chatId, message, keyboard = null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    // ပို့ရမည့် Body
    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    // Keyboard ပါလာရင် ထည့်ပေးမယ်
    if (keyboard) {
        body.reply_markup = keyboard;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        return await response.json();
    } catch (error) {
        console.error("Telegram Bot Error:", error);
    }
}