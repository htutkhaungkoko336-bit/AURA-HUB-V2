// matchmaking.js

// ၁။ Room ဝင်ရောက်ခြင်း (Join Room) - Mode နှင့် Fee တူမှသာ ဝင်ခွင့်ပြုမည်
window.joinMatchRoom = async function(roomDocId, roomData) {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) {
        alert("Device ID မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Login ပြန်ဝင်ပါ။");
        return;
    }

    // ကိုယ့်ရဲ့ Register လုပ်ထားတဲ့ Data ကို ယူမည်
    const registrationData = JSON.parse(localStorage.getItem('aura_last_registration'));
    if (!registrationData) {
        alert("ကျေးဇူးပြု၍ ပထမဦးစွာ Registration လုပ်ပေးပါ။");
        return;
    }

    // Mode တူမတူ စစ်ဆေးခြင်း (ဥပမာ - 5vs5 နှင့် 5vs5)
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
        // Backend API (သို့မဟုတ် Firebase Firestore Logic) သို့ ပို့ရန်
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
            
            // Join ပြီးပါက Host ၏ Create Room ခလုတ်ဖျောက်ရန်နှင့် Refund ပေါ်လာစေရန် UI လုပ်ဆောင်ချက်
            handlePostJoinUI();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alert("Join လုပ်၍ မရပါ: " + error.message);
    }
};

// ၂။ Join ပြီးနောက် UI ပြောင်းလဲမှုများ (Create Room ခလုတ်ပျောက်ပြီး Refund ပေါ်လာစေရန်)
function handlePostJoinUI() {
    // ဥပမာ - Create New Room ခလုတ်ကို ဖျောက်ခြင်း
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) createBtn.style.display = 'none';

    // Refund ခလုတ် သို့မဟုတ် စာသားကို ပေါ်လာစေခြင်း
    const refundSection = document.getElementById('refund-section');
    if (refundSection) refundSection.style.display = 'block';

    // Playing Tab သို့ အလိုအလျောက် ရွှေ့ပြောင်းခြင်း (ရှိပါက)
    if (typeof switchToPlayingTab === 'function') {
        switchToPlayingTab();
    }
}