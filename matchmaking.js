// matchmaking.js

// HTML က ခေါ်နေတဲ့ joinOrViewRoom ကို window object ထဲ ချိတ်ပေးခြင်း
window.joinOrViewRoom = function(roomDocId, roomDataStr) {
    let roomData = roomDataStr;
    // အကယ်၍ string ပုံစံရောက်လာရင် object ပြန်ပြောင်းရန်
    if (typeof roomDataStr === 'string') {
        try {
            roomData = JSON.parse(decodeURIComponent(roomDataStr));
        } catch (e) {
            console.error("Room data parse error:", e);
        }
    }
    
    // အထက်ပါ Mode နဲ့ Fee စစ်ဆေးပြီး join တဲ့ function ကို ဆက်သွားမည်
    window.joinMatchRoom(roomDocId, roomData);
};

// ၁။ Room ဝင်ရောက်ခြင်း (Join Room) - Mode နှင့် Fee တူမှသာ ဝင်ခွင့်ပြုမည်
window.joinMatchRoom = async function(roomDocId, roomData) {
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
        const response = await fetch('/api/join-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId: deviceId,
                roomId: roomDocId,
                joinerData: registrationData
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("🎉 Match ဝင်ရောက်အောင်မြင်ပါပြီ!");
            handlePostJoinUI();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alert("Join လုပ်၍ မရပါ: " + error.message);
    }
};

function handlePostJoinUI() {
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) createBtn.style.display = 'none';

    const refundSection = document.getElementById('refund-section');
    if (refundSection) refundSection.style.display = 'block';

    if (typeof switchToPlayingTab === 'function') {
        switchToPlayingTab();
    }
}