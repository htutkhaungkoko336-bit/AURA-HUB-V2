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
                <div class="ios-match-card">
                    <!-- အပေါ်ဆုံး Badges တွေ (ဥပမာ Sketch ပုံပါအတိုင်း) -->
                    <div class="card-header-badges">
                        <span class="ios-badge">${match.entryFee}</span>
                        <span class="ios-badge">${match.mode}</span>
                        <span class="ios-badge">BO3</span>
                    </div>

                    <!-- အောက်ဘက် Team A vs Team B ပုံစံ -->
                    <div class="match-body-content">
                        <!-- Team A (Left) -->
                        <div class="team-side">
                            <img src="${myData?.logo || 'default-logo.png'}" class="team-logo-img" alt="Logo">
                            <div class="team-info">
                                <div class="team-name">${myData?.teamName || 'Team A'}</div>
                                <div class="player-sub">${myData?.playerName || 'Player'}</div>
                            </div>
                        </div>

                        <!-- VS Center -->
                        <div class="vs-badge-center">VS</div>

                        <!-- Team B (Right) -->
                        <div class="team-side right">
                            <img src="${opponentData?.logo || 'default-logo.png'}" class="team-logo-img" alt="Logo">
                            <div class="team-info">
                                <div class="team-name">${opponentData?.teamName || 'Team B'}</div>
                                <div class="player-sub">${opponentData?.playerName || 'Waiting...'}</div>
                            </div>
                        </div>
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