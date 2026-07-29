// matchmaking.js

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

// 🌟 Tab Design ကိုသာ ပြောင်းပေးမည့် function (loadActiveRooms ကို ဖြုတ်လိုက်ပါပြီ)
export function switchTab(tabName) {
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

    const matchContent = document.getElementById('match-content');
    if (!matchContent) return;

    if (tabName === 'playing') {
        matchContent.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">လက်တလော ယှဉ်ပြိုင်နေဆဲ ပွဲစဉ်များ မရှိသေးပါ။</div>`;
    } 
    else if (tabName === 'result') {
        matchContent.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">ပြီးဆုံးသွားသော ပွဲစဉ် ရလဒ်များ မရှိသေးပါ။</div>`;
    }
    // 'waiting' အတွက်မူ main.js ထဲက loadActiveRooms() က အလုပ်လုပ်သွားပါလိမ့်မယ်
}