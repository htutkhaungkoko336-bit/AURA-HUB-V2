// matchmaking.js

export function joinOrViewRoom(roomDocId, roomDataStr) {
    let roomData = roomDataStr;
    
    // အကယ်၍ string ပုံစံရောက်လာရင် object ပြန်ပြောင်းရန်
    if (typeof roomDataStr === 'string') {
        try {
            roomData = JSON.parse(decodeURIComponent(roomDataStr));
        } catch (e) {
            try {
                roomData = JSON.parse(roomDataStr);
            } catch (err) {
                console.error("Room data parse error:", err);
            }
        }
    }
    
    // Data မမှန်ကန်ပါက သတိပေးပြီး ရပ်တန့်ရန်
    if (!roomData || typeof roomData !== 'object') {
        alert("❌ Room အချက်အလက် မမှန်ကန်ပါ။");
        return;
    }
    
    joinMatchRoom(roomDocId, roomData);
}

export async function joinMatchRoom(roomDocId, roomData) {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) {
        alert("Device ID မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Login ပြန်ဝင်ပါ။");
        return;
    }

    const registrationData = JSON.parse(localStorage.getItem('aura_last_registration'));
    if (!registrationData) {
        alert("ကျေးဇူးပြု၍ ပထမဦးစွာ Registration လုပ်ပေးပါ။");
        return;
    }

    // roomData သို့မဟုတ် property များ မပါလာပါက အမှားမတက်အောင် စစ်ဆေးခြင်း
    if (!roomData || !roomData.mode || !roomData.entryFee) {
        alert("❌ Room အချက်အလက်များ မပြည့်စုံပါ။");
        return;
    }

    // Mode တူမတူ စစ်ဆေးခြင်း
    if (registrationData.mode !== roomData.mode) {
        alert(`❌ Mode မကိုက်ညီပါ။ ဤ Room သည် ${roomData.mode} Mode ဖြစ်ပါသည်။`);
        return;
    }

    // Entry Fee နှုန်းထား တူမတူ စစ်ဆေးခြင်း
    if (registrationData.entryFee !== roomData.entryFee) {
        alert(`❌ Entry Fee နှုန်းထား မကိုက်ညီပါ။ (${roomData.entryFee} သာ လက်ခံသည်)`);
        return;
    }

    // ကိုယ့်အခန်း ကိုယ်ပြန် join တာကို တားမြစ်ခြင်း
    if (roomData.hostDeviceId === deviceId) {
        alert("⚠️ မိမိဖန်တီးထားသော Room ကို မိမိပြန် join ၍ မရပါ။");
        return;
    }

    try {
        // 1vs1 ဖြစ်လျှင် squadName ကို playerName အဖြစ် သတ်မှတ်ပေးရန်
        const formattedJoinerData = {
            ...registrationData,
            playerName: registrationData.playerName || registrationData.squadName || ""
        };

        const response = await fetch('/api/join-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId: deviceId,
                roomId: roomDocId,
                joinerData: formattedJoinerData
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("🎉 Match ဝင်ရောက်အောင်မြင်ပါပြီ!");
            handlePostJoinUI();
        } else {
            throw new Error(result.error || result.message);
        }
    } catch (error) {
        alert("Join လုပ်၍ မရပါ: " + error.message);
    }
}

function handlePostJoinUI() {
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) createBtn.style.display = 'none';

    const refundSection = document.getElementById('refund-section');
    if (refundSection) refundSection.style.display = 'block';

    if (typeof switchToPlayingTab === 'function') {
        switchToPlayingTab();
    }
}

// matchmaking.js (Backend API ကို သုံးမည့် ပုံစံ)

let currentSelectedMatchId = null;

// --- ၁. Playing Tab သို့ ပြောင်းလဲခြင်း ---
export function switchToPlayingTab() {
    document.querySelectorAll('.sub-page').forEach(page => page.style.display = 'none');
    const playingLobby = document.getElementById('page-playing-lobby');
    if (playingLobby) playingLobby.style.display = 'flex';

    // API မှတဆင့် Active Matches များကို ဆွဲထုတ်ရန်
    fetchUserMatches();
}

// --- ၂. Backend API မှတဆင့် Match များကို ဆွဲထုတ်ခြင်း ---
export async function fetchUserMatches() {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) return;

    try {
        // query parameters (type=matches & deviceId) ထည့်သွင်းရန်
        const response = await fetch(`/api/active-rooms?type=matches&deviceId=${deviceId}`);
        const data = await response.json();
        
        const container = document.getElementById('room-cards-container');
        if (!container) return;
        container.innerHTML = '';

        if (data.success && data.rooms && data.rooms.length > 0) {
            data.rooms.forEach(match => {
                renderRoomCard(match.roomId, match, container);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">လက်တလော Active ဖြစ်နေသော Room များ မရှိသေးပါ။</div>`;
        }
    } catch (error) {
        console.error("Error fetching matches:", error);
    }
}
// --- ၃. Room Card တည်ဆောက်ခြင်း ---
export function renderRoomCard(matchId, match, container) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = 'background: rgba(201,166,107,0.05); border: 1px solid #333; border-radius: 12px; padding: 15px; cursor: pointer; position: relative; transition: 0.2s;';
    
    card.onmouseover = () => card.style.borderColor = '#c9a66b';
    card.onmouseout = () => card.style.borderColor = '#333';
    card.onclick = () => openMatchDetailModal(matchId, match);

    card.innerHTML = `
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
            <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${match.entryFee || 'Free'}</span>
            <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${match.mode || '1vs1'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="text-align: center; width: 40%;">
                <img src="${match.logo || 'https://i.ibb.co/4pGm0Zf/default-logo.png'}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #c9a66b; object-fit: cover;">
                <div style="font-size: 0.8rem; color: #f1e4b9; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.teamName || 'Team'}</div>
            </div>
            <div style="font-weight: bold; color: #c9a66b; font-size: 0.9rem;">VS</div>
            <div style="text-align: center; width: 40%;">
                <img src="https://i.ibb.co/4pGm0Zf/default-logo.png" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #444; object-fit: cover;">
                <div style="font-size: 0.8rem; color: #f1e4b9; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Opponent</div>
            </div>
        </div>
    `;
    container.appendChild(card);
}

// --- ၄. Modal ဖွင့်ခြင်း ---
export function openMatchDetailModal(matchId, match) {
    currentSelectedMatchId = matchId;
    const modal = document.getElementById('match-detail-popup');
    if (!modal) return;
    modal.style.display = 'flex';
}

// --- ၅. Confirm / Ready (Backend API သို့ ပို့ရန်) ---
export async function setReadyFromPopup() {
    if (!currentSelectedMatchId) return;
    const deviceId = localStorage.getItem('aura_device_id');

    try {
        const response = await fetch('/api/ready-room', { // သင့် Backend API အမည်အတိုင်း ချိန်ရန်
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: currentSelectedMatchId, deviceId })
        });
        const result = await response.json();
        
        if (result.success) {
            alert("✅ Ready အောင်မြင်ပါသည်။");
            document.getElementById('match-detail-popup').style.display = 'none';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert("အမှားအယွင်းရှိနေပါသည်: " + error.message);
    }
}

// --- ၆. Match ဖျက်သိမ်းခြင်း (Backend API သို့ ပို့ရန်) ---
export async function cancelMatchFromPopup() {
    if (!currentSelectedMatchId) return;
    if (!confirm("ဤ Match ကို ဖျက်သိမ်းရန် သေချာပါသလား?")) return;

    try {
        const response = await fetch('/api/cancel-room', { // သင့် Backend API အမည်အတိုင်း ချိန်ရန်
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: currentSelectedMatchId })
        });
        const result = await response.json();

        if (result.success) {
            alert("❌ Match ကို ဖျက်သိမ်းပြီးပါပြီ။");
            document.getElementById('match-detail-popup').style.display = 'none';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Cancel Error:", error);
    }
}