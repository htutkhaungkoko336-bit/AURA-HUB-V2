import { performLogin } from './auth.js';
import { 
    showDashboard, 
    setupWelcomeModal, 
    initGuideSwiper, 
    openGuide, 
    toggleGuide, 
    goToRooms,
    buyNewRoom 
} from './ui.js';

// --- 1. Global Variables ---
window.currentMode = '5vs5';
let currentIndex = 0;
const mapData = [
    { mode: '5vs5', img: '5vs5.png', title: '5vs5 Preview' },
    { mode: '1vs1', img: '1v1.png', title: '1vs1 Preview' }
];

// --- 2. Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
    initGuideSwiper();

    // Image Preview Click Event Listeners
    setupImageClickListeners();
});

function setupImageClickListeners() {
    const images = [
        { id: 'logoPreview', input: 'sqLogo' },
        { id: 'logoPreview1vs1', input: 'sqLogo1vs1' },
        { id: 'ssPreview', input: 'ssFile-proof' }
    ];

    images.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener('click', () => document.getElementById(item.input).click());
        }
    });
}

// --- 3. Authentication & Navigation ---
window.registerOrLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);
    if (!phoneNumber) { alert("ဖုန်းနံပါတ်ဖြည့်ပါ။"); return; }
    
    const result = await performLogin(phoneNumber, deviceId);
    if (result.ok) {
        alert("Login Successful!");
        showDashboard();
    } else {
        alert("Error: " + result.data.message);
    }
};

window.openGuide = () => openGuide(mapData, currentIndex);
window.toggleGuide = (show) => toggleGuide(show);
window.goToRooms = goToRooms;
window.buyNewRoom = buyNewRoom;

window.nextMap = () => {
    currentIndex = (currentIndex + 1) % mapData.length;
    window.currentMode = mapData[currentIndex].mode;
    updateUI();
};

function updateUI() {
    const map = mapData[currentIndex];
    document.getElementById('mapImg').src = map.img;
    document.querySelector('.map-tag').innerText = `Enter ${map.mode} Mode`;
    document.getElementById('preview-title').innerText = map.title;
}

// --- 4. Room Selection & Flow ---
window.joinRoom = (price) => {
    const mode = window.currentMode || '5vs5';
    document.getElementById('page-room-select').style.display = 'none';

    if (mode === '5vs5') {
        document.getElementById('page-5vs5').style.display = 'block';
        document.getElementById('fee-5vs5').innerText = `Entry Fee: ${price} Ks`;
    } else {
        document.getElementById('page-1vs1').style.display = 'block';
        document.getElementById('fee-1vs1').innerText = `Entry Fee: ${price} Ks`;
    }
};

window.leaveRoom = () => {
    document.getElementById('page-5vs5').style.display = 'none';
    document.getElementById('page-1vs1').style.display = 'none';
    document.getElementById('page-room-select').style.display = 'block';
};

// --- 5. Validation & Payment ---
window.validate5vs5 = () => {
    const squadName = document.getElementById('squad-name')?.value.trim();
    const logoInput = document.getElementById('sqLogo');
    const players = document.querySelectorAll('#page-5vs5 .player-grid-container input');
    let allPlayersFilled = true;
    players.forEach(i => { if(i.value.trim() === "") allPlayersFilled = false; });
    
    return !!(squadName && logoInput.files.length > 0 && allPlayersFilled);
};

window.validate1vs1 = () => {
    const inputs = document.querySelectorAll('#page-1vs1 input[type="text"], #page-1vs1 input[type="number"]');
    const logoInput = document.getElementById('sqLogo1vs1');
    let allFilled = true;
    inputs.forEach(i => { if(i.value.trim() === "") allFilled = false; });
    return !!(allFilled && logoInput.files.length > 0);
};

window.goToPayment = function() {
    const is5vs5 = document.getElementById('page-5vs5').style.display !== 'none';
    const isValid = is5vs5 ? window.validate5vs5() : window.validate1vs1();
    
    if (isValid) {
        document.querySelectorAll('.sub-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-payment-proof').style.display = 'flex';
    } else {
        alert("ကျေးဇူးပြု၍ အချက်အလက်အားလုံးကို ပြည့်စုံအောင် ဖြည့်ပေးပါ။");
    }
};

// --- 6. Backend Integration ---
async function uploadToBackend(file) {
    const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
    });
    const result = await response.json();
    return result.data.display_url;
}

window.submitProof = async function() {
    const is1v1 = (window.currentMode === '1vs1');
    const logoInput = document.getElementById(is1v1 ? 'sqLogo1vs1' : 'sqLogo');
    const ssInput = document.getElementById('ssFile-proof');

    if (!logoInput.files[0] || !ssInput.files[0]) {
        alert("Logo နှင့် Payment Screenshot တင်ပေးပါ။");
        return;
    }

    const btn = document.getElementById('submit-btn');
    if (btn) btn.style.display = 'none';

    try {
        const logoUrl = await uploadToBackend(logoInput.files[0]);
        const screenshotUrl = await uploadToBackend(ssInput.files[0]);
        
        // Payload တည်ဆောက်ခြင်း
        let payload = { logo: logoUrl, paymentScreenshot: screenshotUrl, mode: window.currentMode };
        // (သင့် payload အပြည့်အစုံကို ဒီနေရာမှာ ထည့်ပါ)

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) showWaitingRoom();
        else throw new Error(result.error);
    } catch (error) {
        alert("Error: " + error.message);
        if (btn) btn.style.display = 'block';
    }
};

function showWaitingRoom() {
    document.getElementById('page-payment-proof').style.display = 'none';
    const matchCenter = document.getElementById('page-match-center');
    if (matchCenter) matchCenter.style.display = 'flex';
}

// --- 7. Image Previews ---
window.previewLogo = (e) => updateImagePreview(e, 'logoPreview', 'logoLabel');
window.previewLogo1vs1 = (e) => updateImagePreview(e, 'logoPreview1vs1', 'logoLabel1vs1');
window.previewScreenshot = (e) => updateImagePreview(e, 'ssPreview', 'ss-placeholder');

function updateImagePreview(e, imgId, labelId) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.getElementById(imgId);
            img.src = event.target.result;
            img.style.display = 'block';
            const label = document.getElementById(labelId);
            if (label) label.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}