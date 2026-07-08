// script.js
import { performLogin } from './auth.js';
import { showDashboard, setupWelcomeModal, initGuideSwiper, openGuide, toggleGuide } from './ui.js';

// ၁။ ဒီမှာ Data တွေကို အရင် သတ်မှတ်ပေးပါ (သင့် Project က Data တွေနဲ့ အစားထိုးပါ)
let currentIndex = 0;
const mapData = [
    { mode: '5vs5', img: '5vs5.png', title: '5vs5 Preview', teams: 5 },
    { mode: '1v1', img: '1v1.png', title: '1v1 Preview', teams: 1 } // 1v1 အတွက်
];

// ၂။ UI စတင်ခြင်း
document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
    initGuideSwiper();
});

// ၃။ Login လုပ်ဆောင်ချက်
window.registerOrLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);

    if (!phoneNumber) {
        alert("ကျေးဇူးပြု၍ ဖုန်းနံပါတ်ထည့်သွင်းပေးပါ။");
        return;
    }

    const result = await performLogin(phoneNumber, deviceId);
    
    if (result.ok) {
        alert("Login Successful!");
        showDashboard();
    } else {
        alert("Error: " + result.data.message);
    }
};

// ၄။ Guide လုပ်ဆောင်ချက် (HTML က onclick="openGuide()" ကို ဒီ function က ဖမ်းယူမှာပါ)
window.openGuide = () => {
    openGuide(mapData, currentIndex); 
};

// ၅။ Close လုပ်ဆောင်ချက်
window.toggleGuide = (show) => {
    toggleGuide(show);
};

window.nextMap = () => {
    currentIndex = (currentIndex + 1) % mapData.length;
    updateUI();
};

// script.js ထဲက updateUI() function
function updateUI() {
    const map = mapData[currentIndex];
    
    document.getElementById('mapImg').src = map.img;
    document.querySelector('.map-tag').innerText = `Enter ${map.mode} Mode`;
    document.getElementById('preview-title').innerText = map.title;

    const sideA = document.getElementById('side-a-list');
    const sideB = document.getElementById('side-b-list');
    
    if (map.mode === '1v1') {
        sideA.innerHTML = '<div class="team">Player 1</div>';
        sideB.innerHTML = '<div class="team">Player 1</div>';
    } else {
        // Player 1 ကနေ 5 အထိ အလိုအလျောက် generate လုပ်ပေးခြင်း
        const players = Array.from({length: 5}, (_, i) => `<div class="team">Player ${i + 1}</div>`).join('');
        sideA.innerHTML = players;
        sideB.innerHTML = players;
    }
}