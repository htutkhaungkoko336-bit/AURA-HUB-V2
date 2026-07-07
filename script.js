console.log("script.js loaded successfully!"); // ဒါလေး Console မှာ ပေါ်မပေါ် စစ်ပါ
// HTML element များကို ရယူခြင်း
const checkbox = document.getElementById('welcomeCheckbox');
const enterBtn = document.getElementById('welcomeAgreeBtn');

// Checkbox ပြောင်းလဲတိုင်း ဖြစ်ပေါ်မည့် လုပ်ဆောင်ချက်
checkbox.addEventListener('change', function() {
    if (this.checked) {
        // အမှန်ခြစ် ခြစ်ထားလျှင် ခလုတ်ကို ဖွင့်ပေးပြီး ပုံစံပြောင်းခြင်း
        enterBtn.disabled = false;
        enterBtn.style.cursor = 'pointer';
        enterBtn.style.background = '#c9a66b';
        enterBtn.style.color = '#000';
    } else {
        // အမှန်ခြစ် မခြစ်ထားလျှင် ခလုတ်ကို ပိတ်ထားခြင်း
        enterBtn.disabled = true;
        enterBtn.style.cursor = 'not-allowed';
        enterBtn.style.background = '#333';
        enterBtn.style.color = '#c9a66b';
    }
});

// ခလုတ်နှိပ်လိုက်သည့်အခါ Modal ပိတ်မည့် လုပ်ဆောင်ချက် (ဥပမာ)
enterBtn.addEventListener('click', function() {
    document.getElementById('welcomeModal').style.display = 'none';
});

async function registerOrLogin(phoneNumber) {
    console.log("Button clicked, number:", phoneNumber);
    if (!phoneNumber) {
        alert("ကျေးဇူးပြု၍ ဖုန်းနံပါတ်ထည့်သွင်းပေးပါ။");
        return;
    }

    try {
        const response = await fetch('/api/login', { // Vercel API route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber })
        });

        const data = await response.json();
        
        if (data.success) {
            alert("Login အောင်မြင်ပါသည်။");
        } else {
            alert("Login ကျရှုံးပါသည်။");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// User ပထမဆုံး Login ဝင်တဲ့အခါ ID တစ်ခု generate လုပ်မယ်
let deviceId = localStorage.getItem('aura_device_id');
if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substr(2, 9); // အတိုကောက် ID ဆောက်
    localStorage.setItem('aura_device_id', deviceId);
}

// API ကို ပို့တဲ့အခါ
fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ phone: phoneNumber, deviceId: deviceId }) // ပို့လိုက်ပါ
});