import { performLogin } from './auth.js'
import { 
    showDashboard, 
    setupWelcomeModal, 
    initGuideSwiper, 
    openGuide, 
    toggleGuide, 
    showRoomSelect,
} from './ui.js';

// ၁။ ဒီမှာ Data တွေကို အရင် သတ်မှတ်ပေးပါ (သင့် Project က Data တွေနဲ့ အစားထိုးပါ)
let currentIndex = 0;
const mapData = [
    { mode: '5vs5', img: '5vs5.png', title: '5vs5 Preview', teams: 5 },
    { mode: '1v1', img: '1v1.png', title: '1vs1 Preview', teams: 1 } // 1v1 အတွက်
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
// HTML က onclick="goToRooms()" ကို ဖမ်းယူရန်
window.goToRooms = () => {
    // လက်ရှိ mode (5vs5 or 1v1) ကို mapData ထဲကနေ ယူပါတယ်
    const currentMode = mapData[currentIndex].mode;
    showRoomSelect(currentMode);
};

// Back ခလုတ်အတွက်
window.goBack = () => {
    showDashboard();
};

// Join ခလုတ်ကို နှိပ်လိုက်ရင်
window.joinRoom = (price) => {
    // လက်ရှိ mode ကို ယူခြင်း
    const currentMode = mapData[currentIndex].mode; // '5vs5' သို့မဟုတ် '1vs 1'
    
    // Room Select Page ကို ပိတ်ခြင်း
    document.getElementById('page-room-select').style.display = 'none';

    if (currentMode === '5vs5') {
        const page5v5 = document.getElementById('page-5vs5');
        page5v5.style.display = 'block';
        document.getElementById('fee-5vs5').innerText = `Entry Fee: ${price} Ks`;
    } else {
        const page1v1 = document.getElementById('page-1vs1');
        page1v1.style.display = 'block';
        document.getElementById('fee-1vs1').innerText = `Entry Fee: ${price} Ks`;
    }
};

// Back to Selection ခလုတ်အတွက်
window.leaveRoom = () => {
    // Page အားလုံးကို ပိတ်လိုက်ခြင်း
    document.getElementById('page-5vs5').style.display = 'none';
    document.getElementById('page-1vs1').style.display = 'none';
    
    // Room Select ကို ပြန်ပြခြင်း
    document.getElementById('page-room-select').style.display = 'block';
};



// 5vs5 Logo Preview & Re-selection
function previewLogo(event) {
    const file = event.target.files[0];
    const output = document.getElementById('logoPreview');
    const label = document.getElementById('logoLabel');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            output.src = e.target.result;
            output.style.display = 'block'; // ပုံကို ပြမယ်
            if (label) label.style.display = 'none'; // label ဖျောက်မယ်
        };
        reader.readAsDataURL(file);
    }
}

// 5vs5 ပုံကိုနှိပ်ရင် Input ပြန်ဖွင့်မယ်
document.getElementById('logoPreview').addEventListener('click', function() {
    document.getElementById('sqLogo').click();
});

// 1vs1 Logo Preview & Re-selection
function previewLogo1vs1(event) {
    const file = event.target.files[0];
    const output = document.getElementById('logoPreview1vs1');
    const label = document.getElementById('logoLabel1vs1');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            output.src = e.target.result;
            output.style.display = 'block';
            if (label) label.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// 1vs1 ပုံကိုနှိပ်ရင် Input ပြန်ဖွင့်မယ်
document.getElementById('logoPreview1vs1').addEventListener('click', function() {
    document.getElementById('sqLogo1vs1').click();
});