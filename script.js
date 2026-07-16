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

    // Image Previews Events
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview) logoPreview.addEventListener('click', () => document.getElementById('sqLogo').click());

    const logoPreview1vs1 = document.getElementById('logoPreview1vs1');
    if (logoPreview1vs1) logoPreview1vs1.addEventListener('click', () => document.getElementById('sqLogo1vs1').click());

    const ssPreview = document.getElementById('ssPreview');
    if (ssPreview) ssPreview.addEventListener('click', () => document.getElementById('ssFile-proof').click());
});

// --- 3. Authentication & Navigation ---
window.registerOrLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);
    if (!phoneNumber) { alert("ဖုန်းနံပါတ်ဖြည့်ပါ။"); return; }
    const result = await performLogin(phoneNumber, deviceId);
    if (result.ok) { alert("Login Successful!"); showDashboard(); } else { alert("Error: " + result.data.message); }
};

window.openGuide = () => { openGuide(mapData, currentIndex); };
window.toggleGuide = (show) => { toggleGuide(show); };
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

// --- 4. Room Selection Logic ---
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

// --- 5. Registration & Validation ---
window.validate5vs5 = () => {
    const players = document.querySelectorAll('#page-5vs5 .player-grid-container input');
    let allFilled = true;
    players.forEach(i => { if(i.value.trim() === "") allFilled = false; });
    return !(document.getElementById('squad-name').value.trim() === "" || document.getElementById('sqLogo').files.length === 0 || !allFilled);
};

window.validate1vs1 = () => {
    const inputs = document.querySelectorAll('#page-1vs1 input[type="text"], #page-1vs1 input[type="number"]');
    let allFilled = true;
    inputs.forEach(i => { if(i.value.trim() === "") allFilled = false; });
    return !( !allFilled || document.getElementById('sqLogo1vs1').files.length === 0);
};

window.goToPayment = function() {
    const is5vs5 = document.getElementById('page-5vs5').style.display !== 'none';
    const isValid = is5vs5 ? window.validate5vs5() : window.validate1vs1();
    if (isValid) {
        document.querySelectorAll('.sub-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-payment-proof').style.display = 'flex';
    } else { alert("အချက်အလက်အားလုံး ဖြည့်ပေးပါ။"); }
};

// --- 6. Backend Integration ---
async function uploadToBackend(file) {
    const base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
    });
    const result = await res.json();
    return result.data.display_url;
}

window.submitProof = async function() {
    const is1v1 = (window.currentMode === '1vs1');
    const logoInput = document.getElementById(is1v1 ? 'sqLogo1vs1' : 'sqLogo');
    const ssInput = document.getElementById('ssFile-proof');

    if (!logoInput.files[0] || !ssInput.files[0]) { alert("Logo နှင့် Slip တင်ပေးပါ။"); return; }
    
    document.getElementById('submit-btn').style.display = 'none';

    try {
        const logoUrl = await uploadToBackend(logoInput.files[0]);
        const ssUrl = await uploadToBackend(ssInput.files[0]);
        // ... (payload တည်ဆောက်ပြီး /api/register သို့ fetch လုပ်ပါ) ...
        alert("Registration Success!");
        showWaitingRoom();
    } catch (err) {
        alert("Error: " + err.message);
        document.getElementById('submit-btn').style.display = 'block';
    }
};

function showWaitingRoom() {
    document.getElementById('page-payment-proof').style.display = 'none';
    document.getElementById('page-match-center').style.display = 'flex';
}

// --- 7. Preview Helpers ---
window.previewLogo = (e) => { 
    const output = document.getElementById('logoPreview');
    output.src = URL.createObjectURL(e.target.files[0]);
    output.style.display = 'block';
    document.getElementById('logoLabel').style.display = 'none';
};
window.previewLogo1vs1 = (e) => { 
    const output = document.getElementById('logoPreview1vs1');
    output.src = URL.createObjectURL(e.target.files[0]);
    output.style.display = 'block';
    document.getElementById('logoLabel1vs1').style.display = 'none';
};
window.previewScreenshot = (e) => { 
    const img = document.getElementById('ssPreview');
    img.src = URL.createObjectURL(e.target.files[0]);
    img.style.display = 'block';
    document.getElementById('ss-placeholder').style.display = 'none';
};