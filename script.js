import { performLogin } from './auth.js';
import { 
    showDashboard, 
    setupWelcomeModal, 
    initGuideSwiper, 
    openGuide, 
    toggleGuide, 
    goToRooms,
    buyNewRoom // ui.js မှ import လုပ်ရန်
} from './ui.js';

// Global variables
window.currentMode = '5vs5'; // အစပိုင်းမှာ 5vs5
let currentIndex = 0;

const mapData = [
    { mode: '5vs5', img: '5vs5.png', title: '5vs5 Preview' },
    { mode: '1vs1', img: '1v1.png', title: '1vs1 Preview' }
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

// ၄။ Navigation & UI Logic
window.openGuide = () => { openGuide(mapData, currentIndex); };
window.toggleGuide = (show) => { toggleGuide(show); };
window.goToRooms = goToRooms;
window.buyNewRoom = buyNewRoom; // buyNewRoom ကို window object ထဲထည့်ပေးခြင်း

window.nextMap = () => {
    // Index ပြောင်းခြင်း
    currentIndex = (currentIndex + 1) % mapData.length;
    
    // Global Mode ကို Update လုပ်ခြင်း
    window.currentMode = mapData[currentIndex].mode;
    
    updateUI();
};

function updateUI() {
    const map = mapData[currentIndex];
    
    // UI Update လုပ်ခြင်း
    document.getElementById('mapImg').src = map.img;
    document.querySelector('.map-tag').innerText = `Enter ${map.mode} Mode`;
    document.getElementById('preview-title').innerText = map.title;

    const sideA = document.getElementById('side-a-list');
    const sideB = document.getElementById('side-b-list');
    
    if (map.mode === '1vs1') {
        sideA.innerHTML = '<div class="team">Player 1</div>';
        sideB.innerHTML = '<div class="team">Player 1</div>';
    } else {
        const players = Array.from({length: 5}, (_, i) => `<div class="team">Player ${i + 1}</div>`).join('');
        sideA.innerHTML = players;
        sideB.innerHTML = players;
    }
}