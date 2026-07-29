// playing.js
export async function loadPlayingMatches(deviceId) {
    try {
        // သင့်ရဲ့ API endpoint ဖိုင်နာမည်အတိုင်း /api/activeroom သို့မဟုတ် /api/room-detail ကို သုံးပါ
        const response = await fetch(`/api/activeroom?type=matches&deviceId=${deviceId}`);
        
        // အကယ်၍ Server က 404 တက်နေရင် HTML error စာမျက်နှာ ပြန်တတ်ပါသည်
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) return;

        const playingContainer = document.getElementById('playing-match-content');
        if (!playingContainer) return;

        playingContainer.innerHTML = '';

        if (!result.rooms || result.rooms.length === 0) {
            playingContainer.innerHTML = '<div style="text-align: center; color: #777; margin-top: 50px; font-size: 0.9rem;">No ongoing matches available.</div>';
            return;
        }

        result.rooms.forEach(match => {
            const cardHTML = `
                <div class="room-card" style="background: #111; border: 1.5px solid #FFD700; padding: 15px; border-radius: 12px; margin-bottom: 12px; color: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #FFD700; font-weight: bold; font-size: 0.9rem;">Mode: ${match.mode || '1vs1'}</span>
                        <span style="background: #222; color: #FFD700; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem;">Status: ${match.status}</span>
                    </div>
                    <p style="margin: 5px 0; font-size: 0.85rem;">Host: <strong>${match.host?.playerName || match.host?.teamName || 'N/A'}</strong></p>
                    <p style="margin: 5px 0; font-size: 0.85rem;">Joiner Device: <strong>${match.joiner?.deviceId || 'N/A'}</strong></p>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: #C9A66B;">Entry Fee: ${match.entryFee || '0'}</p>
                </div>
            `;
            playingContainer.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Error loading playing matches:", error);
    }
}