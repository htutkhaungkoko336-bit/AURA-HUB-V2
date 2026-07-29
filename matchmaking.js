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
// --- Tab Switching & Data Fetching Logic ---

export async function switchTab(tabName) {
    // 1. Tab Design များကို Active / Inactive ပြောင်းခြင်း
    const tabs = ['waiting', 'playing', 'result'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.classList.add('active');
                btn.style.color = '#FFD700';
                btn.style.borderBottom = '2px solid #FFD700';
            } else {
                btn.classList.remove('active');
                btn.style.color = '#888';
                btn.style.borderBottom = 'none';
            }
        }
    });

    // 2. Tab အလိုက် ဒေတာများ ဆွဲထုတ်ခြင်း
    const container = document.getElementById('match-content') || document.getElementById('room-cards-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; color: #FFD700; margin-top: 40px; font-size: 0.85rem;">Loading...</div>`;

    if (tabName === 'waiting') {
        // Waiting Room များ ဆွဲထုတ်ရန်
        await loadActiveRooms();
    } 
    else if (tabName === 'playing') {
        // Playing Tab အတွက် ကိုယ်ကစားနေသော Match များ ဆွဲထုတ်ရန်
        await loadPlayingMatches();
    } 
    else if (tabName === 'result') {
        // Result Tab အတွက်
        container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">ရလဒ်များ မရှိသေးပါ။</div>`;
    }
}

// Playing နေသော Match များကို Server မှ ဆွဲထုတ်သည့် Function
async function loadPlayingMatches() {
    const deviceId = localStorage.getItem('aura_device_id');
    const container = document.getElementById('match-content') || document.getElementById('room-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (!deviceId) return;

    try {
        const response = await fetch(`/api/active-rooms?type=matches&deviceId=${deviceId}`);
        const data = await response.json();

        if (data.success && data.rooms && data.rooms.length > 0) {
            data.rooms.forEach(match => {
                appendRoomCardToUI(match);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">လက်တလော ကစားနေသော Match များ မရှိသေးပါ။</div>`;
        }
    } catch (error) {
        console.error("Error fetching matches:", error);
        container.innerHTML = `<div style="text-align: center; color: #eb3838; margin-top: 40px; font-size: 0.85rem;">ဒေတာရယူရာတွင် အမှားအယွင်းရှိသည်။</div>`;
    }
}