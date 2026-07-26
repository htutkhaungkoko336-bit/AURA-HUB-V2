let currentSelectedMatchId = null;

export function joinOrViewRoom(roomDocId, roomDataStr) {
    let roomData = roomDataStr;
    
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

    if (!roomData || !roomData.mode || !roomData.entryFee) {
        alert("❌ Room အချက်အလက်များ မပြည့်စုံပါ။");
        return;
    }

    if (registrationData.mode !== roomData.mode) {
        alert(`❌ Mode မကိုက်ညီပါ။ ဤ Room သည် ${roomData.mode} Mode ဖြစ်ပါသည်။`);
        return;
    }

    if (registrationData.entryFee !== roomData.entryFee) {
        alert(`❌ Entry Fee နှုန်းထား မကိုက်ညီပါ။ (${roomData.entryFee} သာ လက်ခံသည်)`);
        return;
    }

    if (roomData.hostDeviceId === deviceId) {
        alert("⚠️ မိမိဖန်တီးထားသော Room ကို မိမိပြန် join ၍ မရပါ။");
        return;
    }

    try {
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

// --- 1. Waiting Tab အတွက် Room များ ဆွဲထုတ်ခြင်း ---
export async function fetchWaitingRooms() {
    const container = document.getElementById('room-cards-container');
    if (!container) return;
    container.innerHTML = '';

    try {
        const response = await fetch('/api/active-rooms?type=waiting');
        const data = await response.json();

        if (data.success && data.rooms && data.rooms.length > 0) {
            data.rooms.forEach(room => {
                renderWaitingRoomCard(room.roomId, room, container);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">စောင့်ဆိုင်းနေသော Room များ မရှိသေးပါ။</div>`;
        }
    } catch (error) {
        console.error("Error fetching waiting rooms:", error);
    }
}

// --- 2. Playing Tab အတွက် Match များကို ဆွဲထုတ်ခြင်း ---
export async function fetchUserMatches() {
    const deviceId = localStorage.getItem('aura_device_id');
    const container = document.getElementById('room-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (!deviceId) return;

    try {
        const response = await fetch(`/api/active-rooms?type=matches&deviceId=${deviceId}`);
        const data = await response.json();

        if (data.success && data.rooms && data.rooms.length > 0) {
            data.rooms.forEach(match => {
                renderRoomCard(match.roomId, match, container);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">လက်တလော ကစားနေသော Match များ မရှိသေးပါ။</div>`;
        }
    } catch (error) {
        console.error("Error fetching matches:", error);
    }
}

// --- Waiting Room Card တည်ဆောက်ရန် ---
function renderWaitingRoomCard(roomId, room, container) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = 'background: rgba(201,166,107,0.05); border: 1px solid #333; border-radius: 12px; padding: 15px; cursor: pointer; margin-bottom: 10px; transition: 0.2s;';
    
    card.onclick = () => {
        const roomStr = encodeURIComponent(JSON.stringify(room));
        joinOrViewRoom(roomId, roomStr);
    };

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #f1e4b9; font-size: 0.9rem; font-weight: bold;">${room.squadName || room.teamName || 'Team'}</div>
            <div style="display: flex; gap: 8px;">
                <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${room.entryFee || 'Free'}</span>
                <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${room.mode || '1vs1'}</span>
            </div>
        </div>
    `;
    container.appendChild(card);
}

// --- Active Match Card တည်ဆောက်ရန် ---
export function renderRoomCard(matchId, match, container) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = 'background: rgba(201,166,107,0.05); border: 1px solid #333; border-radius: 12px; padding: 15px; cursor: pointer; position: relative; margin-bottom: 10px; transition: 0.2s;';
    
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

// --- Modal ဖွင့်ခြင်း ---
export function openMatchDetailModal(matchId, match) {
    currentSelectedMatchId = matchId;
    const modal = document.getElementById('match-detail-popup');
    if (!modal) return;
    modal.style.display = 'flex';
}

// --- Confirm / Ready ---
export async function setReadyFromPopup() {
    if (!currentSelectedMatchId) return;
    const deviceId = localStorage.getItem('aura_device_id');

    try {
        const response = await fetch('/api/ready-room', {
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

// --- Match ဖျက်သိမ်းခြင်း ---
export async function cancelMatchFromPopup() {
    if (!currentSelectedMatchId) return;
    if (!confirm("ဤ Match ကို ဖျက်သိမ်းရန် သေချာပါသလား?")) return;

    try {
        const response = await fetch('/api/cancel-room', {
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

// --- Tab Switching Logic (Exported) ---
export function switchToWaitingTab() {
    setActiveTab('waiting');
    fetchWaitingRooms(); 
}

export function switchToPlayingTab() {
    setActiveTab('playing');
    fetchUserMatches(); 
}

export function switchToResultTab() {
    setActiveTab('result');
    const container = document.getElementById('room-cards-container');
    if (container) {
        container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">ရလဒ်များ မရှိသေးပါ။</div>`;
    }
}

// --- Active Tab State Styling ---
function setActiveTab(tabName) {
    const tabs = ['waiting', 'playing', 'result'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.classList.add('active');
                btn.style.color = '#c9a66b';
                btn.style.borderBottom = '2px solid #c9a66b';
            } else {
                btn.classList.remove('active');
                btn.style.color = '#888';
                btn.style.borderBottom = 'none';
            }
        }
    });
}

// --- Card UI ကို တည်ဆောက်ပေးသော Function ---
export function appendRoomCardToUI(room) {
    // Waiting Room သို့မဟုတ် Playing Tab အလိုက် ဝင်မယ့် Container များကို ရှာဖွေခြင်း
    const container = document.getElementById('room-cards-container') || document.getElementById('match-content');
    if (!container) return;

    const currentDeviceId = localStorage.getItem('aura_device_id');
    const isOwner = String(room.deviceId) === String(currentDeviceId);

    const logoUrl = room.logo || 'default-logo.png';
    const mode = room.mode || '5vs5';
    
    // Fee စာသား သန့်စင်ခြင်း နှင့် 5000 -> 5K ပုံစံပြောင်းခြင်း
    let rawFee = room.entryFee || '0 Ks';
    let cleanFee = rawFee.replace(/^Entry Fee:\s*/i, '').replace(/^Fee:\s*/i, '').trim();
    let numericFee = parseInt(cleanFee.replace(/[^0-9]/g, '')) || 0;
    let feeText = numericFee >= 1000 ? (numericFee / 1000) + 'K' : cleanFee;

    // 25000 နဲ့ 50000 ဆိုရင် BO3၊ ကျန်တာဆိုရင် BO1
    let boType = (numericFee === 25000 || numericFee === 50000) ? 'BO3' : 'BO1';

    let mainTitle = '';
    if (mode === '1vs1') {
        mainTitle = room.heroName || room.playerName || 'Hero Name';
    } else {
        mainTitle = room.squadName || room.teamName || 'Squad Name';
    }

    // Room object တစ်ခုလုံးကို encode လုပ်ပြီး string အနေနဲ့ ထည့်ပေးခြင်း
    const roomString = encodeURIComponent(JSON.stringify(room));

    // ပိုင်ရှင်ဟုတ်မဟုတ် အလိုက် Action Button ပြောင်းလဲခြင်း
    const actionButtonHTML = isOwner 
        ? `<button class="ios-action-btn btn-cancel-room" onclick="event.stopPropagation(); cancelMyRoom('${room.roomId || room.id}')">Cancel</button>`
        : `<button class="ios-action-btn btn-join-plus" onclick="event.stopPropagation(); joinOrViewRoom('${room.roomId || room.id}', '${roomString}')">+</button>`;

    // 🌟 FEE, MODE, BO သုံးခုစလုံးကို ရိုးရှင်းသပ်ရပ်စွာ တစ်န်းတည်းပြမည့် iOS ဒီဇိုင်းပုံစံ Card HTML
    const cardHTML = `
        <div class="room-card-ios" onclick="openSquadDetail('${room.roomId || room.id}')" style="background: rgba(201,166,107,0.05); border: 1px solid #333; border-radius: 12px; padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; transition: 0.2s;">
            <div class="room-left" style="display: flex; align-items: center; gap: 12px; width: 80%;">
                <img src="${logoUrl}" class="room-logo" alt="Logo" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #c9a66b; object-fit: cover;">
                <div class="room-info" style="overflow: hidden;">
                    <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 4px;">
                        <span class="room-fee" style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${feeText}</span>
                        <span class="room-mode-badge" style="font-size: 11px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 6px; border-radius: 4px;">${mode}</span>
                        <span class="room-bo-badge" style="font-size: 11px; font-weight: bold; background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px;">${boType}</span>
                    </div>
                    <span class="room-team-name" style="font-size: 0.9rem; color: #f1e4b9; font-weight: bold; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mainTitle}</span>
                </div>
            </div>
            <div class="room-right">
                <div>${actionButtonHTML}</div>
            </div>
        </div>
    `;

    // Container ထဲသို့ အသစ်ပေါ်လာမည့် Card ကို ထည့်သွင်းခြင်း
    container.insertAdjacentHTML('afterbegin', cardHTML);
}