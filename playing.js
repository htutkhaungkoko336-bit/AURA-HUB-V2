// // playing.js

function formatFee(feeStr) {
    if (!feeStr) return '0K';
    let rawFee = feeStr.toString();
    let cleanFee = rawFee.replace(/^Entry Fee:\s*/i, '').replace(/^Fee:\s*/i, '').trim();
    let numericFee = parseInt(cleanFee.replace(/[^0-9]/g, '')) || 0;
    return numericFee >= 1000 ? (numericFee / 1000) + 'K' : cleanFee;
}

export async function loadPlayingMatches(deviceId) {
    if (!deviceId) {
        deviceId = localStorage.getItem('aura_device_id');
        if (!deviceId) return;
    }

    try {
        const response = await fetch(`/api/active-rooms?type=matches&deviceId=${deviceId}`);
        const result = await response.json();

        const container = document.getElementById('content-playing');
        if (!container) return;

        if (result.success && result.rooms && result.rooms.length > 0) {
            let html = '';
            
            result.rooms.forEach(match => {
                const isHost = match.host?.deviceId === deviceId;
                const myData = isHost ? match.host : match.joiner;
                const opponentData = isHost ? match.joiner : match.host;

                const feeText = formatFee(match.entryFee);
                let numericFee = parseInt(match.entryFee?.toString().replace(/[^0-9]/g, '')) || 0;
                let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';

                const mode = match.mode || '5vs5';

                const rawMyTitle = mode === '1vs1' 
                    ? (myData?.heroName || myData?.playerName || 'Hero Name') 
                    : (myData?.squadName || myData?.teamName || 'Squad Name');
                const myTitle = rawMyTitle.toUpperCase();

                const rawOpponentTitle = mode === '1vs1' 
                    ? (opponentData?.heroName || opponentData?.playerName || 'Waiting...') 
                    : (opponentData?.squadName || opponentData?.teamName || 'Waiting...');
                const opponentTitle = rawOpponentTitle.toUpperCase();

                html += `
                    <div class="room-card-ios" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; color: #fff;">
                        
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
                            
                            <!-- ဘယ်ဘက် Logo နှင့် အောက်တည့်တည့်၌ နာမည် -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                <img src="${myData?.logo || 'default-logo.png'}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a;" alt="Logo">
                                <span style="font-size: 11px; font-weight: 700; color: #fff; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;">${myTitle}</span>
                            </div>

                            <!-- အလယ်အုပ်စု: အပေါ်မှာ Fee/Mode/BO ကို မူလအတိုင်းထားပြီး၊ VS တစ်ခုတည်းကိုသာ margin-top ဖြင့် အောက်သို့ သီးသန့်ချထားသည် -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;margin-top: 16px;">
                                <div style="display: flex; align-items: center; gap: 7px; margin-top: 2px;">
                                    <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 4px;">${feeText}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 5px; border-radius: 4px;">${mode}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 5px; border-radius: 4px;">${boType}</span>
                                </div>
                                <div style="font-size: 9px; font-weight: 800; color: #FFD700; background: rgba(255, 215, 0, 0.08); padding: 2px 10px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.25); letter-spacing: 1px; margin-top: 10px;">VS</div>
                            </div>

                            <!-- ညာဘက် Logo နှင့် အောက်တည့်တည့်၌ နာမည် -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                <img src="${opponentData?.logo || 'default-logo.png'}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a;" alt="Logo">
                                <span style="font-size: 11px; font-weight: 700; color: #fff; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;">${opponentTitle}</span>
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