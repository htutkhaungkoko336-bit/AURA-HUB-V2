// api/upload.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { imageBase64 } = req.body; // Frontend ကနေ base64 နဲ့ ပို့မယ်
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ image: imageBase64 })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}