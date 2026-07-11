import { handleTelegramCallback } from './bot.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const update = req.body;
    if (update.callback_query) {
        await handleTelegramCallback(update.callback_query);
    }
    return res.status(200).json({ success: true });
}