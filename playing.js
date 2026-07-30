// // playing.js

/**
 * Waiting Room ပုံစံအတိုင်း Fee စာသား သန့်စင်ခြင်း နှင့် 5000 -> 5K ပုံစံပြောင်းခြင်း
 */
function formatFee(feeStr) {
    if (!feeStr) return '0K';
    let rawFee = feeStr.toString();
    let cleanFee = rawFee.replace(/^Entry Fee:\s*/i, '').replace(/^Fee:\s*/i, '').trim();
    let numericFee = parseInt(cleanFee.replace(/[^0-9]/g, '')) || 0;
    return numericFee >= 1000 ? (numericFee / 1000) + 'K' : cleanFee;
}

/**
 * Playing Tab အတွက် API မှ Match များကို လှမ်းခေါ်ပြီး Screen ပေါ်တွင် ပြသရန်
 */
export async function loadPlayingMatches(deviceId) {
    if (!deviceId) {
        deviceId = localStorage.getItem('aura_device_id');
        if (!deviceId) return;
    }

    try {
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

                // Fee ကို 5K, 50K ပုံစံပြောင်းရန်
                const feeText = formatFee(match.entryFee);
                
                // Numeric fee ကို ယူပြီး BO3 လား BO1 လား ဆုံးဖြတ်ရန်
                let numericFee = parseInt(match.entryFee?.toString().replace(/[^0-9]/g, '')) || 0;
                let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';

                const mode = match.mode || '5vs5';
                const myLogo = myData?.logo || 'default-logo.png';
                const myTeamTitle = mode === '1vs1' ? (myData?.heroName || myData?.playerName || 'Hero Name') : (myData?.squadName || myData?.teamName || 'Squad Name');
                
                const opponentLogo = opponentData?.logo || 'default-logo.png';
                const opponentTeamTitle = mode === '1vs1' ? (opponentData?.heroName || opponentData?.playerName || 'Waiting...') : (opponentData?.squadName || opponentData?.teamName || 'Waiting...');

                // Waiting Room Card ပုံစံအတိုင်း iOS Design ဖြင့် တည်ဆောက်ခြင်း
                html += `
                    <div class="room-card-ios" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; color: #fff;">
                        
                        <!-- ဘယ်ဘက်ခြမ်း (Logo + Badges + Team Name) -->
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <img src="${myLogo}" style="width: 45px; height: 45px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a;" alt="Logo">
                            
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <!-- Badges တွေတစ်န်းတည်း -->
                                <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                                    <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${feeText}</span>
                                    <span style="font-size: 11px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 6px; border-radius: 4px;">${mode}</span>
                                    <span style="font-size: 11px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px;">${boType}</span>
                                </div>
                                <span style="font-size: 14px; font-weight: 700; color: #fff;">${myTeamTitle} vs ${opponentTeamTitle}</span>
                            </div>
                        </div>

                        <!-- ညာဘက်ခြမ်း (Status သို့မဟုတ် Action Button လိုအပ်ပါက ထည့်ရန်) -->
                        <div style="font-size: 12px; font-weight: bold; color: #00ff00; background: rgba(0, 255, 0, 0.1); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(0, 255, 0, 0.3);">
                            ${match.status || 'Matched'}
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