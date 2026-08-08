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
        // 🔥 type=matches အစား type=rooms နှင့် status=matched ကို သုံးရန် ပြင်ဆင်ခြင်း
        const response = await fetch(`/api/active-rooms?type=rooms&status=matched&deviceId=${deviceId}`);
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
                    <div class="room-card-ios" onclick="openPlayingMatchDetail('${match.roomId || match.id}')" style="background: rgba(26, 26, 26, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; color: #fff; cursor: pointer;">
                        
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%; padding: 0 4px;">
                            
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <img src="${myData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                <span style="font-size: ` + `12px; font-weight: 800; color: #fff; width: 100%; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; margin-top: 6px;">${myTitle}</span>
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
// Global variable အနေဖြင့် interval ကို သိမ်းဆည်းရန်
let matchDetailInterval = null;

export async function openPlayingMatchDetail(roomId) {
    const modal = document.getElementById('room-detail-modal');
    const modalBody = document.getElementById('modal-body-content');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal) return;

    modalBody.innerHTML = `<div style="text-align: center; padding: 20px; color: #FFD700;">Loading...</div>`;
    modal.style.display = 'flex';

    // ယခင်ဖွင့်ထားသော Modal အတွက် Interval ရှိุပါက clear လုပ်ရန်
    if (matchDetailInterval) clearInterval(matchDetailInterval);

    // Real-time Fetch လုပ်မည့် Function သီးသန့်
    const fetchMatchDetail = async () => {
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

            // Ready ဖြစ်မဖြစ် အခြေအနေကို စစ်ဆေးခြင်း
            let hostReady = host.confirmed === true;
            let joinerReady = joiner.confirmed === true;

            // အစိမ်းရောင် လင်းမည့် Style (Box shadow နဲ့ border)
            let hostLogoBorder = hostReady ? 'border: 2px solid #32CD32; box-shadow: 0 0 12px rgba(50, 205, 50, 0.8);' : 'border: 1.5px solid #FFD700;';
            let joinerLogoBorder = joinerReady ? 'border: 2px solid #32CD32; box-shadow: 0 0 12px rgba(50, 205, 50, 0.8);' : 'border: 1.5px solid #FFD700;';

            let currentDeviceId = localStorage.getItem('aura_device_id') || '';
            let isHost = currentDeviceId === host.deviceId;
            let isJoiner = currentDeviceId === joiner.deviceId;
            let isHostOrJoiner = isHost || isJoiner;

            let isConfirmed = isHost ? hostReady : joinerReady;

            let actionButtonsHTML = '';
            if (isHostOrJoiner) {
                let readyText = isConfirmed ? 'Unready' : 'Ready';
                let readyBg = isConfirmed 
                    ? 'background: rgba(50, 205, 50, 0.2); color: #32CD32; border: 1px solid rgba(50, 205, 50, 0.4);' 
                    : 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none;';

                let cancelOpacity = isConfirmed ? '0.4' : '1';
                let cancelCursor = isConfirmed ? 'not-allowed' : 'pointer';

                actionButtonsHTML = `
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="toggleMatchReady('${roomId}', ${!isConfirmed}, this)" style="flex: 1; ${readyBg} padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">${readyText}</button>
                        <button onclick="${isConfirmed ? '' : `cancelMatch('${roomId}')`}" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; opacity: ${cancelOpacity}; cursor: ${cancelCursor};">Cancel Match</button>
                    </div>
                `;
            }

            let contentHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px; color: #fff; width: 100%;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px;">
                        
                        <!-- Host Logo & Status -->
                        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; position: relative;">
                            ${hostReady ? '<span style="position: absolute; top: -5px; right: 25px; width: 10px; height: 10px; background: #32CD32; border-radius: 50%; box-shadow: 0 0 8px #32CD32;"></span>' : ''}
                            <img src="${hostLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; ${hostLogoBorder}" alt="Logo">
                            ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: ${hostReady ? '#32CD32' : '#FFD700'}; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${host.squadName || 'Team A'}</span>` : ''}
                        </div>

                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; padding: 0 6px;">
                            <div style="display: flex; gap: 4px;">
                                <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">${feeText}</span>
                                <span style="background: #FFD700; color: #000; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${mode}</span>
                                <span style="background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px;">${boType}</span>
                            </div>
                        </div>

                        <!-- Joiner Logo & Status -->
                        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; position: relative;">
                            ${joinerReady ? '<span style="position: absolute; top: -5px; right: 25px; width: 10px; height: 10px; background: #32CD32; border-radius: 50%; box-shadow: 0 0 8px #32CD32;"></span>' : ''}
                            <img src="${joinerLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; ${joinerLogoBorder}" alt="Logo">
                            ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: ${joinerReady ? '#32CD32' : '#FFD700'}; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joiner.squadName || 'Team B'}</span>` : ''}
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
                                <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hostPlayer}</span>
                                <span style="font-size: 11px; color: #aaa; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${hostHero})</span>
                                ${isHostOrJoiner ? `
                                    <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 8px 0; width: 100%;"></div>
                                    <span style="font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold;">Contact</span>
                                    <span style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${host.contact || '-'}</span>
                                ` : ''}
                            </div>
                            <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                                <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fff;">VS</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                                <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joinerPlayer}</span>
                                <span style="font-size: 11px; color: #aaa; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${joinerHero})</span>
                                ${isHostOrJoiner ? `
                                    <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 8px 0; width: 100%;"></div>
                                    <span style="font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold;">Contact</span>
                                    <span style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joiner.contact || '-'}</span>
                                ` : ''}
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
                    let hp = hostPlayers[i] || '-';
                    let jp = joinerPlayers[i] || 'Waiting...';

                    hostPlayersHTML += `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hp}</span>`;
                    joinerPlayersHTML += `<span style="font-size: 11px; font-weight: bold; color: #fff; display: block; padding: 3px 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${jp}</span>`;
                    
                    if (i < 4) {
                        hostPlayersHTML += `<div style="border-top: 1px solid rgba(255,255,255,0.08); width: 100%;"></div>`;
                        joinerPlayersHTML += `<div style="border-top: 1px solid rgba(255,255,255,0.08); width: 100%;"></div>`;
                    }
                }

                contentHTML += `
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                        <div style="display: flex; position: relative; align-items: stretch; gap: 14px;">
                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1; justify-content: center;">
                                <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team A Players</span>
                                <div style="border-top: 1px solid rgba(255,215,0,0.2); margin-bottom: 6px; width: 100%;"></div>
                                ${hostPlayersHTML}
                                ${isHostOrJoiner && host.contact ? `
                                    <div style="border-top: 1px solid rgba(255,215,0,0.2); margin: 6px 0; width: 100%;"></div>
                                    <span style="font-size: 9px; color: #888;">Contact: ${host.contact}</span>
                                ` : ''}
                            </div>
                            <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                                <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fff;">VS</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1; justify-content: center;">
                                <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team B Players</span>
                                <div style="border-top: 1px solid rgba(255,215,0,0.2); margin-bottom: 6px; width: 100%;"></div>
                                ${joinerPlayersHTML}
                                ${isHostOrJoiner && joiner.contact ? `
                                    <div style="border-top: 1px solid rgba(255,215,0,0.2); margin: 6px 0; width: 100%;"></div>
                                    <span style="font-size: 9px; color: #888;">Contact: ${joiner.contact}</span>
                                ` : ''}
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
        }
    };

    // ပထမအကြိမ် ချက်ချင်းခေါ်မည်
    await fetchMatchDetail();

    // ၃ စက္ကန့်တစ်ကြိမ် (3000 ms) ဆက်တိုက် ခေါ်ယူပေးမည် (Real-time update အတွက်)
    matchDetailInterval = setInterval(fetchMatchDetail, 500);
}
export async function toggleMatchReady(roomId, status, btnElement) {
    let deviceId = localStorage.getItem('aura_device_id') || '';
    if (!deviceId) return;

    try {
        const response = await fetch('/api/room-detail-playing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId, action: 'ready', status })
        });
        const result = await response.json();
        
        if (result.success) {
            const readyBtn = btnElement; 
            const actionContainer = readyBtn ? readyBtn.parentElement : null;
            const cancelBtn = actionContainer ? actionContainer.querySelector('button:nth-child(2)') : null;

            if (status === true) {
                readyBtn.innerText = 'Unready';
                readyBtn.style.background = 'rgba(50, 205, 50, 0.2)';
                readyBtn.style.color = '#32CD32';
                readyBtn.style.border = '1px solid rgba(50, 205, 50, 0.4)';
                readyBtn.setAttribute('onclick', `toggleMatchReady('${roomId}', false, this)`);

                if (cancelBtn) {
                    cancelBtn.style.opacity = '0.4';
                    cancelBtn.style.cursor = 'not-allowed';
                    cancelBtn.setAttribute('onclick', '');
                }
            } else {
                readyBtn.innerText = 'Ready';
                readyBtn.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
                readyBtn.style.color = '#000';
                readyBtn.style.border = 'none';
                readyBtn.setAttribute('onclick', `toggleMatchReady('${roomId}', true, this)`);

                if (cancelBtn) {
                    cancelBtn.style.opacity = '1';
                    cancelBtn.style.cursor = 'pointer';
                    cancelBtn.setAttribute('onclick', `cancelMatch('${roomId}')`);
                }
            }

            loadPlayingMatches(deviceId);

        } else {
            alert(result.message || 'Action failed');
        }
    } catch (error) {
        console.error("Ready/Unready Error:", error);
    }
}

export async function cancelMatch(roomId) {
    let deviceId = localStorage.getItem('aura_device_id') || '';
    if (!deviceId) return;

    if (!confirm('ဒီပွဲစဉ်ကို ဖျက်သိမ်းမှာ သေချာပါသလား? (Joiner ဖျက်ပါက Room သည် Waiting သို့ ပြန်သွားမည်ဖြစ်ပြီး၊ Host ဖျက်ပါက Room လုံးဝ ပျက်သွားမည်ဖြစ်ပါသည်။)')) return;

    try {
        const response = await fetch('/api/room-detail-playing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, deviceId, action: 'cancel' }) // deviceId ထည့်ပေးရန်
        });
        const result = await response.json();
        if (result.success) {
            closeRoomDetailModal();
            loadPlayingMatches(deviceId);
        } else {
            alert(result.message || 'Cancel failed');
        }
    } catch (error) {
        console.error("Cancel Error:", error);
    }
}
export function closeRoomDetailModal() {
    const modal = document.getElementById('room-detail-modal');
    if (modal) {
        modal.style.display = 'none';
        if (matchDetailInterval) {
            clearInterval(matchDetailInterval);
            matchDetailInterval = null;
        }
    }
}