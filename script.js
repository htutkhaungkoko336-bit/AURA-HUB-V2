console.log("script.js loaded successfully!");

// HTML element များကို ရယူခြင်း
const checkbox = document.getElementById('welcomeCheckbox');
const enterBtn = document.getElementById('welcomeAgreeBtn');

// Checkbox လုပ်ဆောင်ချက်
checkbox.addEventListener('change', function() {
    if (this.checked) {
        enterBtn.disabled = false;
        enterBtn.style.cursor = 'pointer';
        enterBtn.style.background = '#c9a66b';
        enterBtn.style.color = '#000';
    } else {
        enterBtn.disabled = true;
        enterBtn.style.cursor = 'not-allowed';
        enterBtn.style.background = '#333';
        enterBtn.style.color = '#c9a66b';
    }
});

// Modal ပိတ်ခြင်း
enterBtn.addEventListener('click', function() {
    document.getElementById('welcomeModal').style.display = 'none';
});

// Login လုပ်ဆောင်ချက်
async function registerOrLogin(phoneNumber) {
    // ၁။ Device ID ရယူခြင်း
    let deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('aura_device_id', deviceId);
    }

    console.log("Button clicked, number:", phoneNumber, "DeviceID:", deviceId);

    if (!phoneNumber) {
        alert("ကျေးဇူးပြု၍ ဖုန်းနံပါတ်ထည့်သွင်းပေးပါ။");
        return;
    }

    try {
        // ၂။ API ကို ခေါ်ယူခြင်း
        // script.js ထဲက fetch အပိုင်း
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber, deviceId: deviceId })
        });

        const data = await response.json();

        // response.ok သည် status code 200-299 ဖြစ်မှ true ဖြစ်ပါမည်
        if (response.ok) {
            alert("Login အောင်မြင်ပါသည်။");
        } else {
            // 403 error တက်ရင် ဒီအောက်က message ပေါ်လာပါမယ်
            alert("Error: " + data.message); 
        }
    } catch (error) {
        console.error("Error:", error);
    }
}