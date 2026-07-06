const checkbox = document.getElementById("welcomeCheckbox");
const enterBtn = document.getElementById("welcomeAgreeBtn");
const modal = document.getElementById("welcomeModal");

// Checkbox ကို tick ခြစ်လိုက်တိုင်း အလုပ်လုပ်မည့် function
checkbox.addEventListener("change", function() {
    if (this.checked) {
        // Tick ခြစ်ထားရင် button ကို ဖွင့်ပေးပြီး ပုံစံပြောင်းမယ်
        enterBtn.disabled = false;
        enterBtn.style.cursor = "pointer";
        enterBtn.style.background = "#c9a66b";
        enterBtn.style.color = "#1a1a1a";
    } else {
        // Tick မခြစ်ထားရင် button ကို ပြန်ပိတ်မယ်
        enterBtn.disabled = true;
        enterBtn.style.cursor = "not-allowed";
        enterBtn.style.background = "#333";
        enterBtn.style.color = "#c9a66b";
    }
});

// Button ကို နှိပ်လိုက်ရင် Modal ပျောက်သွားအောင်လုပ်မည့် function
enterBtn.addEventListener("click", function() {
    if (!enterBtn.disabled) {
        modal.style.display = "none";
    }
});
// login ဝင်ရင် Random id တစ်ခုကို generate လုပ်ပေးမယ်
function getDeviceId() {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
}
//Frontend မှာ User က Phone Number ရိုက်ပြီး Continue နှိပ်လိုက်ရင် အောက်ပါ Code ကို Run ပါမယ်။
async function registerOrLogin() {
    const phoneNo = document.getElementById("phone-no").value;
    const deviceId = getDeviceId();

    // API ကို Request ပို့မယ်
    const response = await fetch('YOUR_VERCEL_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNo, deviceId: deviceId })
    });

    const data = await response.json();

    if (data.success) {
        alert("Login အောင်မြင်ပါသည်");
        // Dashboard သို့ ပို့မယ်
    } else {
        alert(data.message); // "ဤဖုန်းနံပါတ်ကို အခြား device တွင် အသုံးပြုထားသည်"
    }
}
// firebase နဲ့ frontend နဲ့ ချိတ်ပေးတဲ့ firebase SDK သူက user မြင်လဲ ဘာမှ မဖြစ်ဘူး 
const firebaseConfig = {
  apiKey: "AIzaSyCqIFh8-OzlDPQAqboKHaq8-Jx_4jlVd4M",
  authDomain: "mlbb-matchmaking.firebaseapp.com",
  projectId: "mlbb-matchmaking",
  storageBucket: "mlbb-matchmaking.firebasestorage.app",
  messagingSenderId: "539846137130",
  appId: "1:539846137130:web:74f413b22ea5488564ba53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);