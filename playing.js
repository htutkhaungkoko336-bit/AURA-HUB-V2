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

                // တစ်ဖက်လူ Ready ဖြစ်မဖြစ် စစ်ဆေးရန် (Backend က isReady ပို့ပေးသည်ကို သုံးမည်)
                const isOpponentReady = isHost ? match.joiner?.isReady : match.host?.isReady;

                html += `
                    <div class="room-card-ios" onclick="openPlayingMatchDetail('${match.roomId}')" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; color: #fff; cursor: pointer;">
                        
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%; padding: 0 4px;">
                            
                            <!-- ကိုယ့်အသင်း Logo နှင့် Status -->
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <div style="position: relative; display: inline-block;">
                                    <img src="${myData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                    ${myData?.isReady ? `<span style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background-color: #28a745; border: 2px solid #000; border-radius: 50%;"></span>` : ''}
                                </div>
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

                            <!-- တစ်ဖက်အသင်း Logo နှင့် Ready Indicator (အစိမ်းရောင်မီးစိမ်း) -->
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <div style="position: relative; display: inline-block;">
                                    <img src="${opponentData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                    ${isOpponentReady ? `<span style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background-color: #28a745; border: 2px solid #000; border-radius: 50%;"></span>` : ''}
                                </div>
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

        // ကိုယ်ဘက်က လက်ရှိ Ready ပြီးသားလား စစ်ဆေးရန်
        let myIsReady = isHost ? host.isReady : joiner.isReady;

        let actionButtonsHTML = '';
        if (isHostOrJoiner) {
            actionButtonsHTML = `
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button id="ready-action-btn" onclick="toggleReadyState('${roomId}')" style="flex: 1; background: ${myIsReady ? '#28a745' : 'linear-gradient(135deg, #FFD700, #FFA500)'}; color: ${myIsReady ? '#fff' : '#000'}; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
                        ${myIsReady ? 'Unready' : 'Ready'}
                    </button>
                    <button id="cancel-match-btn" onclick="cancelMatch('${roomId}')" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; opacity: ${myIsReady ? '0.4' : '1'}; pointer-events: ${myIsReady ? 'none' : 'auto'};">
                        CANCEL MATCH
                    </button>
                </div>
            `;
        }

        let contentHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; color: #fff; width: 100%;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center;">
                        <div style="position: relative; display: inline-block;">
                            <img src="${hostLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1.5px solid #FFD700;" alt="Logo">
                            ${host.isReady ? `<span style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background-color: #28a745; border: 2px solid #000; border-radius: 50%;"></span>` : ''}
                        </div>
                        ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${host.squadName || 'Team A'}</span>` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; padding: 0 6px;">
                        <div style="display: flex; gap: 4px;">
                            <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">${feeText}</span>
                            <span style="background: #FFD700; color: #000; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${mode}</span>
                            <span style="background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px;">${boType}</span>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center;">
                        <div style="position: relative; display: inline-block;">
                            <img src="${joinerLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1.5px solid #FFD700;" alt="Logo">
                            ${joiner.isReady ? `<span style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background-color: #28a745; border: 2px solid #000; border-radius: 50%;"></span>` : ''}
                        </div>
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
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px;">VS</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase;">${joinerPlayer}</span>
                            <span style="font-size: 11px; color: #aaa; margin-top: 2px;">(${joinerHero})</span>
                        </div>
                    </div>
                    ${actionButtonsHTML}
                </div>
            `;
        } else {
            let hostPlayers = Array.isArray(host.players) ? host.players : [];
            let joinerPlayers = Array.isArray(joiner.players) ? joiner.players : [];

            let hostPlayersHTML = hostPlayers.map(p => `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0;">${p}</span>`).join('');
            let joinerPlayersHTML = joinerPlayers.map(p => `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0;">${p}</span>`).join('');

            contentHTML += `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                    <div style="display: flex; position: relative; align-items: stretch; gap: 14px;">
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 9px; color: #FFD700; font-weight: bold;">Team A Players</span>
                            ${hostPlayersHTML}
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px;">VS</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 9px; color: #FFD700; font-weight: bold;">Team B Players</span>
                            ${joinerPlayersHTML}
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

// Global functions များ (Window တွင် တွဲပေးရန်)
window.toggleReadyState = async function(roomId) {
    let deviceId = localStorage.getItem('aura_device_id');
    try {
        const res = await fetch('/api/room-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId })
        });
        const data = await res.json();
        if (data.success) {
            openPlayingMatchDetail(roomId); // Modal ကို Refresh လုပ်မည်
            loadPlayingMatches(deviceId);   // Main List ကိုပါ Update လုပ်မည်
        }
    } catch (e) {
        console.error("Ready toggle error:", e);
    }
}

window.cancelMatch = async function(roomId) {
    if (!confirm("ဒီပွဲစဉ်ကို ဖျက်သိမ်းမှာ သေချာပါသလား?")) return;
    let deviceId = localStorage.getItem('aura_device_id');
    try {
        const res = await fetch('/api/room-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId })
        });
        const data = await res.json();
        if (data.success) {
            closeRoomDetailModal();
            loadPlayingMatches(deviceId);
        } else {
            alert(data.message || "မအောင်မြင်ပါ။");
        }
    } catch (e) {
        console.error("Cancel match error:", e);
    }
}

export function closeRoomDetailModal() {
    const modal = document.getElementById('room-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}