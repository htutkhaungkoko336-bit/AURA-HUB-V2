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

                // Mode အလိုက် နာမည်ပြောင်းလဲခြင်း (5vs5 ဆိုရင် Squad Name၊ 1vs1 ဆိုရင် Hero Name)
                const myTitle = mode === '1vs1' 
                    ? (myData?.heroName || myData?.playerName || 'Hero Name') 
                    : (myData?.squadName || myData?.teamName || 'Squad Name');

                const opponentTitle = mode === '1vs1' 
                    ? (opponentData?.heroName || opponentData?.playerName || 'Waiting...') 
                    : (opponentData?.squadName || opponentData?.teamName || 'Waiting...');

                html += `
                    <div class="room-card-ios" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 10px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; color: #fff;">
                        
                        <!-- အပေါ်/အလယ်ပိုင်း: ဘယ်ဘက် Logo + Name - အလယ် Badges - ညာဘက် Logo + Name -->
                        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 4px;">
                            
                            <!-- ဘယ်ဘက် Team A (အပေါ် Logo၊ အောက် Name) -->
                            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 3px;">
                                <img src="${myData?.logo || 'default-logo.png'}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a;" alt="Logo">
                                <div style="font-size: 12px; font-weight: 700; color: #fff; max-width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${myTitle}</div>
                            </div>

                            <!-- အလယ်မှာ Fee, Mode, BO အတုံးလေးများ -->
                            <div style="display: flex; align-items: center; gap: 4px; justify-content: center;">
                                <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 4px;">${feeText}</span>
                                <span style="font-size: 10px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 5px; border-radius: 4px;">${mode}</span>
                                <span style="font-size: 10px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 5px; border-radius: 4px;">${boType}</span>
                            </div>

                            <!-- ညာဘက် Team B (အပေါ် Logo၊ အောက် Name) -->
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px; text-align: right;">
                                <img src="${opponentData?.logo || 'default-logo.png'}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a;" alt="Logo">
                                <div style="font-size: 12px; font-weight: 700; color: #fff; max-width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${opponentTitle}</div>
                            </div>

                        </div>

                        <!-- အောက်ဘက်: VS ကို လေးထောင့်တုံးလေးထဲ ထည့်၍ အလယ်တွင်ပြရန် -->
                        <div style="display: flex; justify-content: center; width: 100%;">
                            <div style="font-size: 10px; font-weight: 800; color: #FFD700; background: rgba(255, 215, 0, 0.08); padding: 2px 12px; border-radius: 5px; border: 1px solid rgba(255, 215, 0, 0.25); letter-spacing: 1px;">VS</div>
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