import { performLogin } from './auth.js'
import { 
    showDashboard, 
    setupWelcomeModal, 
    initGuideSwiper, 
    openGuide, 
    toggleGuide, 
    showRoomSelect,
} from './ui.js';

let currentMode = '5vs5'; // Default အနေနဲ့ 5vs5 ကို ပေးထားပါ

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



// --- Logo Preview Functions ---
window.previewLogo = function(event) {
    const file = event.target.files[0];
    const output = document.getElementById('logoPreview');
    const label = document.getElementById('logoLabel');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            output.src = e.target.result;
            output.style.display = 'block';
            if (label) label.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};

window.previewLogo1vs1 = function(event) {
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
};

// --- Validation Logic ---
window.validate5vs5 = function() {
    const squadName = document.getElementById('squad-name').value.trim();
    const kpayName = document.getElementById('kpay-name').value.trim();
    const kpayNo = document.getElementById('kpay-no').value.trim();
    const logoInput = document.getElementById('sqLogo');
    const players = document.querySelectorAll('#page-5vs5 .player-grid-container input');
    
    let allPlayersFilled = true;
    players.forEach(input => { if(input.value.trim() === "") allPlayersFilled = false; });

    return !(squadName === "" || kpayName === "" || kpayNo === "" || logoInput.files.length === 0 || !allPlayersFilled);
};

window.validate1vs1 = function() {
    const inputs = document.querySelectorAll('#page-1vs1 input[type="text"], #page-1vs1 input[type="number"]');
    const logoInput = document.getElementById('sqLogo1vs1');
    let allFilled = true;
    inputs.forEach(input => { if(input.value.trim() === "") allFilled = false; });

    return !( !allFilled || logoInput.files.length === 0);
};

// --- Main Navigation Logic ---
window.goToPayment = function() {
    // ၁။ ဘယ် Mode ဖြစ်နေလဲဆိုတာ စစ်ပြီး currentMode ထဲမှာ သိမ်းမယ်
    const is5vs5 = document.getElementById('page-5vs5').style.display !== 'none';
    currentMode = is5vs5 ? '5vs5' : '1vs1'; 
    
    console.log("Current Mode saved as:", currentMode); // Debug လုပ်ဖို့

    // ၂။ Validation စစ်မယ်
    const isValid = is5vs5 ? window.validate5vs5() : window.validate1vs1();

    // ၃။ အမှန်ဆိုရင် Page ကူးမယ်
    if (isValid) {
        document.querySelectorAll('.sub-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-payment-proof').style.display = 'flex';
    } else {
        alert("ကျေးဇူးပြု၍ အချက်အလက်အားလုံးကို ပြည့်စုံအောင် ဖြည့်ပေးပါ။");
    }
};

// 5vs5 Logo Preview & Re-selection
document.getElementById('logoPreview').addEventListener('click', function() {
    this.style.display = 'none';
    this.src = "#"; 
    document.getElementById('sqLogo').value = ""; 
    document.getElementById('logoLabel').style.display = 'flex'; 
    document.getElementById('sqLogo').click();
});

// 1vs1 Logo Preview & Re-selection
document.getElementById('logoPreview1vs1').addEventListener('click', function() {
    this.style.display = 'none';
    this.src = "#"; 
    document.getElementById('sqLogo1vs1').value = ""; 
    document.getElementById('logoLabel1vs1').style.display = 'flex'; 
    document.getElementById('sqLogo1vs1').click();
});
window.backToRegistration = function() {
    document.getElementById('page-payment-proof').style.display = 'none';
    const mode = mapData[currentIndex].mode; 
    if (mode === '5vs5') {
        document.getElementById('page-5vs5').style.display = 'block';
    } else {
        document.getElementById('page-1vs1').style.display = 'block';
    }
};
// Screenshot Preview Function
window.previewScreenshot = function(event) {
    const file = event.target.files[0];
    const img = document.getElementById('ssPreview'); // Payment Proof Page ထဲက ID
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('ss-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};
document.addEventListener('DOMContentLoaded', function() {
    const ssPreview = document.getElementById('ssPreview');
    if (ssPreview) {
        ssPreview.addEventListener('click', function() {
            this.style.display = 'none';
            this.src = "#";
            document.getElementById('ssFile').value = ""; 
            document.getElementById('ss-placeholder').style.display = 'flex';
            document.getElementById('ssFile').click();
        });
    }
});
//imgg
async function uploadToBackend(file) {
    // ပုံကို Base64 ပြောင်းခြင်း
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
    return result.data.display_url; // Imgbb URL ကို ရပြီ
}
window.submitProof = async function() {
    const is1v1Visible = (currentMode === '1vs1');
    const logoInputId = is1v1Visible ? 'sqLogo1vs1' : 'sqLogo';
    
    const logoInput = document.getElementById(logoInputId);
    const ssInput = document.getElementById('ssFile-proof');

    if (!logoInput || logoInput.files.length === 0 || !ssInput || ssInput.files.length === 0) {
        alert("Logo နှင့် Payment Screenshot တင်ပေးပါ။");
        return;
    }

    document.getElementById('submit-btn').style.display = 'none';

    try {
        const logoUrl = await uploadToBackend(logoInput.files[0]);
        const screenshotUrl = await uploadToBackend(ssInput.files[0]);
        
        let payload = {
            logo: logoUrl,
            paymentScreenshot: screenshotUrl,
            mode: currentMode,
            createdAt: new Date().toLocaleString('en-GB', { 
                timeZone: 'Asia/Yangon',
                hour12: true 
            }) 
        };
        if (is1v1Visible) {
            payload.squadName = document.getElementById('solo-player-name')?.value || 'N/A';
            payload.heroName = document.getElementById('hero-name-input')?.value || 'N/A';
            payload.kpayName = document.getElementById('kpay-name-solo')?.value || 'N/A';
            payload.kpayNo = document.getElementById('kpay-no-solo')?.value || 'N/A';
            payload.entryFee = document.getElementById('fee-1vs1')?.innerText || '0 Ks'; // ထည့်ပေးလိုက်ပါ
            payload.mlbbId = document.querySelector('#page-1vs1 .player-row input[type="number"]')?.value || 'N/A';
        } else {
            payload.squadName = document.getElementById('squad-name')?.value || 'N/A';
            payload.entryFee = document.getElementById('fee-5vs5')?.innerText || '0 Ks';
            payload.kpayName = document.getElementById('kpay-name')?.value || 'N/A';
            payload.kpayNo = document.getElementById('kpay-no')?.value || 'N/A';
            
            // Player 5 ယောက်စာ Loop ပတ်ဖမ်းခြင်း
            const playerRows = document.querySelectorAll('#page-5vs5 .player-row');
            playerRows.forEach((row, index) => {
                const inputs = row.querySelectorAll('input');
                payload[`player${index + 1}`] = {
                    name: inputs[0].value || 'N/A',
                    id: inputs[1].value || 'N/A'
                };
            });
        }

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            // အောင်မြင်သွားရင် Waiting Room ကို ပြောင်းမယ်
            showWaitingRoom();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alert("Error: " + error.message);
        document.getElementById('submit-btn').style.display = 'block';
    }
};








// --- ၁။ ခလုတ်များ ထိန်းချုပ်ခြင်း ---
export function enableButtons() {
    const actionButtons = document.getElementById('action-buttons');
    if (actionButtons) actionButtons.style.display = 'flex';
    
    // Status စာသားကို အတည်ပြုကြောင်း ပြပေးမယ်
    const matchContent = document.getElementById('match-content');
    if (matchContent) {
        matchContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #4caf50;">
                <h2>✅ Registration Confirmed!</h2>
                <p>သင်၏ပွဲစဉ်ကို Admin မှ အတည်ပြုပေးလိုက်ပါပြီ။</p>
            </div>`;
    }
}

// --- ၂။ Waiting Room စတင်ပြသခြင်း ---
export function showWaitingRoom() {
    const paymentPage = document.getElementById('page-payment-proof');
    if (paymentPage) paymentPage.style.display = 'none';

    const matchCenter = document.getElementById('page-match-center');
    if (matchCenter) matchCenter.style.display = 'flex';

    // ခလုတ်တွေကို အရင်ဖျောက်ထားမယ်
    const actionButtons = document.getElementById('action-buttons');
    if (actionButtons) actionButtons.style.display = 'none'; 

    const matchContent = document.getElementById('match-content');
    if (matchContent) {
        matchContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c9a66b;">
                <h3>⏳ Registration ကို Admin မှ စစ်ဆေးနေပါသည်။</h3>
                <p>အတည်ပြုပြီးသည်နှင့် ခလုတ်များ အလိုအလျောက် ပေါ်လာပါမည်။</p>
            </div>`;
    }
}

// --- ၃။ Tab ပြောင်းလဲခြင်း ---
export function switchTab(tabName, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    const content = document.getElementById('match-content');

    switch(tabName) {
        case 'waiting':
            const savedStatus = localStorage.getItem('reg_status');
            if (savedStatus === 'confirm') {
                enableButtons(); 
            } else {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #c9a66b;">
                        <h3>⏳ Admin စစ်ဆေးနေပါသည်</h3>
                        <p>သင်၏ Registration ကို အတည်ပြုပေးပါမည်။ ခဏစောင့်ပေးပါ။</p>
                    </div>`;
            }
            break;
            
        case 'playing':
            content.innerHTML = `
                <div style="color: #fff; padding: 20px;">
                    <h3>⚔️ Playing Room</h3>
                    <p>လက်ရှိ ပွဲစဉ်များ မရှိသေးပါ။</p>
                </div>`;
            break;
            
        case 'result':
            content.innerHTML = `
                <div style="color: #fff; padding: 20px;">
                    <h3>🏆 Match Results</h3>
                    <p>ပြီးခဲ့သော ပွဲစဉ် ရလဒ်များ မရှိသေးပါ။</p>
                </div>`;
            break;
    }
}

// --- ၄။ Initialize လုပ်ခြင်း ---
export function initTabs() {
    const tabs = [
        { id: 'tab-waiting', name: 'waiting' },
        { id: 'tab-playing', name: 'playing' },
        { id: 'tab-result', name: 'result' }
    ];

    tabs.forEach(tab => {
        const btn = document.getElementById(tab.id);
        if (btn) {
            btn.onclick = () => switchTab(tab.name, btn);
        }
    });
}