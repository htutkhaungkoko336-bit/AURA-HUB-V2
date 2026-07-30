// // playing.js (သို့မဟုတ် UI rendering file)

// 1️⃣ Fee ကို အတိုကောက်ပြောင်းပေးမည့် Helper Function (ဒီနေရာမှာ ထည့်ပါ)
function formatFee(feeStr) {
    if (!feeStr) return '0k';
    const match = feeStr.toString().match(/\d+/);
    if (!match) return feeStr;
    
    let num = parseInt(match[0], 10);
    if (num >= 1000) {
        return (num / 1000) + 'k';
    }
    return num.toString();
}

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

                // 2️⃣ Fee ကို အတိုကောက်ပြောင်းရန် function ကို ဒီမှာ ခေါ်သုံးသည် (ဥပမာ: 50k)
                const shortFee = formatFee(match.entryFee);

                html += `
                <div class="ios-match-card">
                    <!-- အပေါ်ဆုံး Badges တွေ (Sketch ပုံပါအတိုင်း အတုံးလေးများ) -->
                    <div class="card-header-badges">
                        <span class="ios-badge">${shortFee}</span>
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