// playing.js
export async function openPlayingMatchDetail(roomId) {
    const modal = document.getElementById('room-detail-modal');
    const modalBody = document.getElementById('modal-body-content');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal) return;

    modalBody.innerHTML = `<div style="text-align: center; padding: 20px; color: #FFD700;">Loading...</div>`;
    modal.style.display = 'flex';

    try {
        // 🌟 ဖိုင်အသစ်ခွဲထားသော API လမ်းကြောင်းသို့ ချိတ်ဆက်ခြင်း
        const response = await fetch('/api/room-detail-playing?roomId=' + encodeURIComponent(roomId));
        const result = await response.json();

        if (!result.success) {
            modalBody.innerHTML = `<p style="color: #eb3838; text-align: center;">ဒေတာဆွဲယူ၍ မရပါ</p>`;
            return;
        }

        const match = result.data;
        modalTitle.innerText = match.mode === '1vs1' ? '1vs1 Match Details' : 'Match VS Details';

        const host = match.host || {};
        const joiner = match.joiner || {};

        let feeText = formatFee(match.entryFee);
        let numericFee = parseInt(match.entryFee?.toString().replace(/[^0-9]/g, '')) || 0;
        let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';
        let mode = match.mode || '5vs5';

        let hostLogo = host.logo || 'default-logo.png';
        let joinerLogo = joiner.logo || 'default-logo.png';

        let hostTitle = (mode === '1vs1' ? (host.heroName || host.playerName) : (host.squadName || host.teamName)) || 'Team A';
        let joinerTitle = (mode === '1vs1' ? (joiner.heroName || joiner.playerName) : (joiner.squadName || joiner.teamName)) || 'Team B';

        let contentHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; color: #fff; width: 100%;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <img src="${hostLogo}" style="width: 45px; height: 45px; border-radius: 10px; object-fit: cover; border: 1px solid #FFD700;" alt="Logo">
                        <span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hostTitle}</span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <span style="background: rgba(255, 215, 0, 0.15); color: #FFD700; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">${feeText}</span>
                        <span style="background: #FFD700; color: #000; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${mode}</span>
                        <span style="background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px;">${boType}</span>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <img src="${joinerLogo}" style="width: 45px; height: 45px; border-radius: 10px; object-fit: cover; border: 1px solid #FFD700;" alt="Logo">
                        <span style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #FFD700; text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joinerTitle}</span>
                    </div>
                </div>
        `;

        let hostPlayers = Array.isArray(host.players) ? host.players : [];
        let joinerPlayers = Array.isArray(joiner.players) ? joiner.players : [];

        for (let i = 0; i < 5; i++) {
            let pNum = i + 1;
            let hp = hostPlayers[i] || '-';
            let jp = joinerPlayers[i] || '-';

            let middleElement = `<span style="font-size: 10px; color: #888;">-</span>`;
            if (pNum === 3) {
                middleElement = `<span style="font-size: 10px; font-weight: bold; color: #FFD700; background: rgba(255,215,0,0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3);">VS</span>`;
            }

            contentHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 11px; color: #fff; flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">P${pNum}: ${hp}</div>
                    <div style="padding: 0 8px; flex-shrink: 0;">${middleElement}</div>
                    <div style="font-size: 11px; color: #fff; flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${jp} :P${pNum}</div>
                </div>
            `;
        }

        let hostContact = host.contact || host.leaderPhone || '-';
        let joinerContact = joiner.contact || joiner.leaderPhone || '-';

        contentHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 8px; margin-top: 4px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 10px; color: #ccc;">Contact: ${hostContact}</div>
                <div style="font-size: 10px; color: #ccc;">Contact: ${joinerContact}</div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button onclick="closeRoomDetailModal()" style="flex: 1; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Confirm</button>
                <button onclick="closeRoomDetailModal()" style="flex: 1; background: rgba(235, 56, 56, 0.2); color: #eb3838; border: 1px solid rgba(235, 56, 56, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Cancel</button>
            </div>

        </div>
        `;

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