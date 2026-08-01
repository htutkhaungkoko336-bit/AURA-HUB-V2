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

        // Container တွင် card များများလာပါက scroll လုပ်နိုင်ရန်
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
                            
                            <!-- ဘယ်ဘက်အခြမ်း -->
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0;">
                                <img src="${myData?.logo || 'default-logo.png'}" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; border: 1.5px solid rgba(255, 215, 0, 0.4); background: #2a2a2a; flex-shrink: 0;" alt="Logo">
                                <span style="font-size: 12px; font-weight: 800; color: #fff; width: 100%; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; margin-top: 6px;">${myTitle}</span>
                            </div>

                            <!-- အလယ်အုပ်စု (Fee, Mode, BO နဲ့ VS တုံး) -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 14px; flex-shrink: 0; padding: 0 8px;">
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                    <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 4px;">${feeText}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 5px; border-radius: 4px;">${mode}</span>
                                    <span style="font-size: 10px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 5px; border-radius: 4px;">${boType}</span>
                                </div>
                                <div style="font-size: 11px; font-weight: 900; color: #FFD700; background: rgba(255, 215, 0, 0.12); padding: 4px 14px; border-radius: 6px; border: 1.5px solid rgba(255, 215, 0, 0.35); letter-spacing: 1.5px; margin-top: 10px;">VS</div>
                            </div>

                            <!-- ညာဘက်အခြမ်း -->
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
        
        // 🌟 1vs1 နှင့် 5vs5 နှစ်ခုစလုံးအတွက် Match Details ဟုသာ ပြသရန်
        modalTitle.innerText = 'Match Details';

        const host = match.host || {};
        const joiner = match.joiner || {};

        let feeText = formatFee(match.entryFee);
        let numericFee = parseInt(match.entryFee?.toString().replace(/[^0-9]/g, '')) || 0;
        let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';

        let hostLogo = host.logo || 'default-logo.png';
        let joinerLogo = joiner.logo || 'default-logo.png';

        let contentHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; color: #fff; width: 100%;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px;">
                    <!-- Host (Team A) Logo & Squad Name -->
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center;">
                        <img src="${hostLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid #FFD700;" alt="Logo">
                        ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${host.squadName || 'Team A'}</span>` : ''}
                    </div>

                    <!-- Center Badges -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; padding: 0 6px;">
                        <div style="display: flex; gap: 4px;">
                            <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">${feeText}</span>
                            <span style="background: #FFD700; color: #000; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${mode}</span>
                            <span style="background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px;">${boType}</span>
                        </div>
                    </div>

                    <!-- Joiner (Team B) Logo & Squad Name -->
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center;">
                        <img src="${joinerLogo}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid #FFD700;" alt="Logo">
                        ${mode !== '1vs1' ? `<span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joiner.squadName || 'Team B'}</span>` : ''}
                    </div>
                </div>
        `;

        if (mode === '1vs1') {
            let hostPlayer = host.playerName || 'N/A';
            let hostHero = host.heroName || 'N/A';
            let hostContact = host.contact || '-';
            
            let joinerPlayer = joiner.playerName || 'Waiting...';
            let joinerHero = joiner.heroName || 'Waiting...';
            let joinerContact = joiner.contact || '-';

            contentHTML += `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                    
                    <div style="display: flex; position: relative; align-items: center; gap: 14px;">
                        
                        <!-- ဘယ်ဘက်ခြမ်း: Host အကွက် -->
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hostPlayer}</span>
                            <span style="font-size: 11px; color: #aaa; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${hostHero})</span>
                            <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 8px 0; width: 100%;"></div>
                            <span style="font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold;">Contact</span>
                            <span style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hostContact}</span>
                        </div>

                        <!-- အလယ်တည့်တည့်ရှိ VS ဘောင် -->
                        <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fff;">VS</span>
                        </div>

                        <!-- ညာဘက်ခြမ်း: Joiner အကွက် -->
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1;">
                            <span style="font-size: 12px; font-weight: bold; color: #FFD700; text-transform: uppercase; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joinerPlayer}</span>
                            <span style="font-size: 11px; color: #aaa; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${joinerHero})</span>
                            <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 8px 0; width: 100%;"></div>
                            <span style="font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold;">Contact</span>
                            <span style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joinerContact}</span>
                        </div>

                    </div>

                    <!-- Confirm နှင့် Cancel ခလုတ်များကို ဘေးတိုက် (Horizontal) ထားရှိခြင်း -->
                    <div style="display: flex; gap: 10px;">
                        <button onclick="closeRoomDetailModal()" style="flex: 1; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Confirm</button>
                        <button onclick="closeRoomDetailModal()" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Cancel</button>
                    </div>

                </div>
            `;
        } else {
            // 🌟 5vs5 အတွက် 1vs1 ပုံစံတူ ကစားသမားနာမည်များကို ဘေးချင်းယှဉ် အောက်ဘက်သို့ အစဉ်လိုက် ထပ်ပြပေးခြင်း
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
                        
                        <!-- ဘယ်ဘက်ခြမ်း: Host (Team A) ကစားသမားများ အကွက် -->
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1; justify-content: center;">
                            <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team A Players</span>
                            <div style="border-top: 1px solid rgba(255,215,0,0.2); margin-bottom: 6px; width: 100%;"></div>
                            ${hostPlayersHTML}
                        </div>

                        <!-- အလယ်တည့်တည့်ရှိ VS ဘောင် -->
                        <div style="display: flex; align-items: center; justify-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;">
                            <span style="font-size: 10px; font-weight: bold; color: #000; background: #FFD700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fff;">VS</span>
                        </div>

                        <!-- ညာဘက်ခြမ်း: Joiner (Team B) ကစားသမားများ အကွက် -->
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); flex: 1; justify-content: center;">
                            <span style="font-size: 9px; color: #FFD700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Team B Players</span>
                            <div style="border-top: 1px solid rgba(255,215,0,0.2); margin-bottom: 6px; width: 100%;"></div>
                            ${joinerPlayersHTML}
                        </div>

                    </div>

                    <!-- Confirm နှင့် Cancel ခလုတ်များကို ဘေးတိုက် (Horizontal) ထားရှိခြင်း -->
                    <div style="display: flex; gap: 10px;">
                        <button onclick="closeRoomDetailModal()" style="flex: 1; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Confirm</button>
                        <button onclick="closeRoomDetailModal()" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Cancel</button>
                    </div>

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
export function closeRoomDetailModal() {
    const modal = document.getElementById('room-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}