// playing.js (သို့မဟုတ် UI rendering file)

/**
 * Playing Tab အတွက် API မှ Match များကို လှမ်းခေါ်ပြီး Screen ပေါ်တွင် ပြသရန်
 */
export async function loadPlayingMatches() {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) {
        console.error("Device ID မတွေ့ရှိပါ။");
        return;
    }

    try {
        // active-rooms API ကို type=matches ဖြင့် လှမ်းခေါ်ခြင်း
        const response = await fetch(`/api/active-rooms?type=matches&deviceId=${deviceId}`);
        const result = await response.json();

        const container = document.getElementById('content-playing'); // Playing Tab ရဲ့ container ID
        if (!container) return;

        if (result.success && result.rooms && result.rooms.length > 0) {
            let html = '';
            
            result.rooms.forEach(match => {
                const isHost = match.host?.deviceId === deviceId;
                const myData = isHost ? match.host : match.joiner;
                const opponentData = isHost ? match.joiner : match.host;

                html += `
                    <div class="match-card" style="background: #1a1a1a; border: 1px solid #FFD700; padding: 15px; margin-bottom: 15px; border-radius: 8px; color: #fff;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #FFD700; font-weight: bold;">Mode: ${match.mode}</span>
                            <span style="color: #00ff00;">Status: ${match.status}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p><strong>My Team:</strong> ${myData?.teamName || 'N/A'}</p>
                                <p><strong>Player:</strong> ${myData?.playerName || 'N/A'}</p>
                            </div>
                            <div style="font-weight: bold; color: #FFD700;">VS</div>
                            <div>
                                <p><strong>Opponent:</strong> ${opponentData?.teamName || 'Waiting...'}</p>
                                <p><strong>Player:</strong> ${opponentData?.playerName || 'Waiting...'}</p>
                            </div>
                        </div>
                        <div style="margin-top: 10px; font-size: 14px; color: #aaa;">
                            Entry Fee: ${match.entryFee}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } else {
            container.innerHTML = `<p style="text-align: center; color: #888; margin-top: 20px;">No ongoing matches available</p>`;
        }
    } catch (error) {
        console.error("Error loading playing matches:", error);
    }
}