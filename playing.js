// playing.js

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

        container.style.maxHeight = '65vh';
        container.style.overflowY = 'auto';
        container.style.paddingRight = '4px';

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
                    <div class="room-card-ios" onclick="openPlayingMatchDetail('${match.roomId}')" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; color: #fff; cursor: pointer;">
                        
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%; padding: 0 4px;">
                            
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <img src="${myData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                <span style="font-size: 12px; font-weight: 800; color: #fff; width: 100%; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; margin-top: 6px;">${myTitle}</span>
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 14px; flex-shrink: 0; padding: 0 8px;">
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                    <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 4px;">${feeText}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 5px; border-radius: 4px;">${mode}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 5px; border-radius: 4px;">${boType}</span>
                                </div>
                                <div style="font-size: 11px; font-weight: 900; color: #FFD700; background: rgba(255, 215, 0, 0.12); padding: 4px 14px; border-radius: 6px; border: 1.5px solid rgba(255, 215, 0, 0.35); letter-spacing: 1.5px; margin-top: 10px;">VS</div>
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <img src="${opponentData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                <span style="font-size: 12px; font-weight: 800; color: #fff; width: 100%; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; margin-top: 6px;">${opponentTitle}</span>
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

export async function openPlayingMatchDetail(roomId) {
    const modal = document.getElementById('room-detail-modal');
    const modalBody = document.getElementById('modal-body-content');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal) return;

    modalBody.innerHTML = `<div style="text-align: center; padding: 20px; color: #FFD700;">Loading...</div>`;
    modal.style.display = 'flex';

    try {
        const response = await fetch('/api/room-detail-playing?roomId=' + encodeURIComponent(roomId));
        const result = await response.json();

        if (!result.success) {
            modalBody.innerHTML = `<p style="color: #eb3838; text-align: center;">ဒေတာဆွဲယူ၍ မရပါ</p>`;
            return;
        }

        const match = result.data;
        const mode = match.mode || '5vs5';
        
        modalTitle.innerText = 'Match Details';

        const host = match.host || {};
        const joiner = match.joiner || {};

        let feeText = formatFee(match.entryFee);
        let numericFee = parseInt(match.entryFee?.toString().replace(/[^0-9]/g, '')) || 0;
        let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';

        let hostLogo = host.logo || 'default-logo.png';
        let joinerLogo = joiner.logo || 'default-logo.png';

        let currentDeviceId = localStorage.getItem('aura_device_id') || '';
        let isHost = currentDeviceId === host.deviceId;
        let isJoiner = currentDeviceId === joiner.deviceId;
        let isHostOrJoiner = isHost || isJoiner;

        // Ready အခြေအနေကို စစ်ဆေးခြင်း
        let myReady = isHost ? host.confirmed : (isJoiner ? joiner.confirmed : false);
        
        // တဖက်အသင်း၏ Ready အခြေအနေ (စိမ်းပြာရောင်/အစိမ်းလေးလင်းရန်)
        let hostReadyIndicator = host.confirmed 
            ? `<span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #22c55e;"></span>` 
            : `<span style="width: 8px; height: 8px; background-color: #6b7280; border-radius: 50%; display: inline-block;"></span>`;
            
        let joinerReadyIndicator = joiner.confirmed 
            ? `<span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #22c55e;"></span>` 
            : `<span style="width: 8px; height: 8px; background-color: #6b7280; border-radius: 50%; display: inline-block;"></span>`;

        let actionButtonsHTML = '';
        if (isHostOrJoiner) {
            // Ready နှိပ်ထားရင် Unready ပေါ်မယ်၊ Cancel Match က မှိန်သွားမယ် (pointer-events: none / opacity: 0.4)
            let readyBtnText = myReady ? 'UNREADY' : 'READY';
            let readyBtnBg = myReady 
                ? 'background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.4);' 
                : 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none;';
            
            let cancelOpacity = myReady ? 'opacity: 0.4; pointer-events: none;' : 'opacity: 1;';

            actionButtonsHTML = `
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="toggleMatchReady('${roomId}', ${!myReady})" style="flex: 1; ${readyBtnBg} padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">${readyBtnText}</button>
                    <button onclick="cancelMatchRoom('${roomId}')" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; ${cancelOpacity}">CANCEL MATCH</button>
                </div>
            `;
        }

        let contentHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; color: #fff; width: 100%;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; position: relative;">
                        <div style="position: absolute; top: -4px; right: 15px;">${hostReadyIndicator}</div>
                        <img src="${hostLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1.5px solid #FFD700;" alt="Logo">
                        ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${host.squadName || 'Team A'}</span>` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; padding: 0 6px;">
                        <div style="display: flex; gap: 4px;">
                            <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">${feeText}</span>
                            <span style="background: #FFD700; color: #000; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${mode}</span>
                            <span style="background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px;">${boType}</span>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; position: relative;">
                        <div style="position: absolute; top: -4px; right: 15px;">${joinerReadyIndicator}</div>
                        <img src="${joinerLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1.5px solid #FFD700;" alt="Logo">
                        ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joiner.squadName || 'Team B'}</span>` : ''}
                    </div>
                </div>
        `;

        if (mode === '1vs1') {
            let hostPlayer = host.playerName || 'N/A';
            let hostHero = host.heroName || 'N/A';
            let joinerPlayer = joiner.playerName || 'Waiting...';
            let joinerHero = joiner.heroName || 'Waiting...';

            contentHTML += `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                    <div style="display: flex; position: relative; align-items: center; gap: 14px;">
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase;">${hostPlayer}</span>
                            <span style="font-size: 11px; color: #aaa; margin-top: 2px;">(${hostHero})</span>
                            ${isHostOrJoiner ? `<span style="font-size: 9px; color: #888; margin-top: 4px;">Contact: ${host.contact || '-'}</span>` : ''}
                        </div>
                        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px;">VS</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase;">${joinerPlayer}</span>
                            <span style="font-size: 11px; color: #aaa; margin-top: 2px;">(${joinerHero})</span>
                            ${isHostOrJoiner ? `<span style="font-size: 9px; color: #888; margin-top: 4px;">Contact: ${joiner.contact || '-'}</span>` : ''}
                        </div>
                    </div>
                    ${actionButtonsHTML}
                </div>
            `;
        } else {
            let hostPlayers = Array.isArray(host.players) ? host.players : [];
            let joinerPlayers = Array.isArray(joiner.players) ? joiner.players : [];

            let hostPlayersHTML = '';
            let joinerPlayersHTML = '';

            for (let i = 0; i < 5; i++) {
                hostPlayersHTML += `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0;">${hostPlayers[i] || '-'}</span>`;
                joinerPlayersHTML += `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0;">${joinerPlayers[i] || 'Waiting...'}</span>`;
                if (i < 4) {
                    hostPlayersHTML += `<div style="border-top: 1px solid rgba(255,255,255,0.08); width: 100%;"></div>`;
                    joinerPlayersHTML += `<div style="border-top: 1px solid rgba(255,255,255,0.08); width: 100%;"></div>`;
                }
            }

            contentHTML += `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                    <div style="display: flex; position: relative; align-items: stretch; gap: 14px;">
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team A Players</span>
                            ${hostPlayersHTML}
                            ${isHostOrJoiner && host.contact ? `<span style="font-size: 9px; color: #888; margin-top: 4px;">Contact: ${host.contact}</span>` : ''}
                        </div>
                        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px;">VS</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team B Players</span>
                            ${joinerPlayersHTML}
                            ${isHostOrJoiner && joiner.contact ? `<span style="font-size: 9px; color: #888; margin-top: 4px;">Contact: ${joiner.contact}</span>` : ''}
                        </div>
                    </div>
                    ${actionButtonsHTML}
                </div>
            `;
        }

        contentHTML += `</div>`;
        modalBody.innerHTML = contentHTML;

    } catch (err) {
        console.error(err);
        modalBody.innerHTML = `<p style="color: #eb3838; text-align: center;">Connection Error</p>`;
    }
}

// Ready / Unready ပြုလုပ်ရန် API ခေါ်သည့် function
window.toggleMatchReady = async function(roomId, status) {
    const deviceId = localStorage.getItem('aura_device_id');
    try {
        const res = await fetch('/api/room-detail-playing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId, action: 'ready', status })
        });
        const data = await res.json();
        if (data.success) {
            openPlayingMatchDetail(roomId); // UI ကို ပုံစံပြောင်းရန် ပြန်ဆွဲမည်
            loadPlayingMatches(deviceId);
        } else {
            alert(data.message || 'Error updating status');
        }
    } catch (e) {
        console.error(e);
    }
};

// Match ထဲမှ ထွက်ရန် (Cancel Match) လုပ်သည့် function
window.cancelMatchRoom = async function(roomId) {
    if (!confirm('ဒီပွဲစဉ်ကို ဖျက်သိမ်းပြီး ထွက်မှာ သေချာပါသလား?')) return;
    const deviceId = localStorage.getItem('aura_device_id');
    try {
        const res = await fetch('/api/room-detail-playing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId, action: 'cancel' })
        });
        const data = await res.json();
        if (data.success) {
            closeRoomDetailModal();
            loadPlayingMatches(deviceId);
        } else {
            alert(data.message || 'Error cancelling match');
        }
    } catch (e) {
        console.error(e);
    }
};
export function closeRoomDetailModal() {
    const modal = document.getElementById('room-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}