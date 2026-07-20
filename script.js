import { performLogin } from './auth.js';
import { 
    showDashboard, 
    setupWelcomeModal, 
    initGuideSwiper, 
    openGuide, 
    toggleGuide, 
    goToRooms,
    buyNewRoom,
    backToWaitingRoom // ui.js မှ import လုပ်ရန်
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
// --- Registration & Validation Logic ---
window.joinRoom = (price) => {
    // ၁။ လက်ရှိ mode ကို mapData ကနေယူ (သို့မဟုတ် window.currentMode ကိုသုံး)
    const mode = window.currentMode || '5vs5'; 
    
    // ၂။ Room Select Page ကို ပိတ်မယ်
    document.getElementById('page-room-select').style.display = 'none';

    // ၃။ Mode ပေါ်မူတည်ပြီး Page ဖွင့်ပြီး Fee ကို ထည့်ပေးမယ်
    if (mode === '5vs5') {
        const page5vs5 = document.getElementById('page-5vs5');
        page5vs5.style.display = 'block';
        // HTML ထဲက fee-5vs5 ID ကို ရှာပြီး ဈေးနှုန်းပြောင်း
        const feeDisplay = document.getElementById('fee-5vs5');
        if (feeDisplay) feeDisplay.innerText = `Entry Fee: ${price} Ks`;
    } else {
        const page1vs1 = document.getElementById('page-1vs1');
        page1vs1.style.display = 'block';
        // HTML ထဲက fee-1vs1 ID ကို ရှာပြီး ဈေးနှုန်းပြောင်း
        const feeDisplay = document.getElementById('fee-1vs1');
        if (feeDisplay) feeDisplay.innerText = `Entry Fee: ${price} Ks`;
    }
};
// ၁။ Validation: 5vs5 အတွက်
window.validate5vs5 = function() {
    const squadName = document.getElementById('squad-name')?.value.trim();
    const kpayName = document.getElementById('kpay-name')?.value.trim();
    const kpayNo = document.getElementById('kpay-no')?.value.trim();
    const logoInput = document.getElementById('sqLogo');
    const players = document.querySelectorAll('#page-5vs5 .player-grid-container input');
    
    let allPlayersFilled = true;
    players.forEach(input => { if(input.value.trim() === "") allPlayersFilled = false; });

    return !(squadName === "" || kpayName === "" || kpayNo === "" || logoInput.files.length === 0 || !allPlayersFilled);
};
// ၂။ Validation: 1vs1 အတွက်
window.validate1vs1 = function() {
    const inputs = document.querySelectorAll('#page-1vs1 input[type="text"], #page-1vs1 input[type="number"]');
    const logoInput = document.getElementById('sqLogo1vs1');
    let allFilled = true;
    inputs.forEach(input => { if(input.value.trim() === "") allFilled = false; });

    return !( !allFilled || logoInput.files.length === 0);
};
// ၃။ Page ကူးပြောင်းခြင်း (Confirm & Pay)
window.goToPayment = function() {
    const is5vs5 = document.getElementById('page-5vs5').style.display !== 'none';
    currentMode = is5vs5 ? '5vs5' : '1vs1'; 
    
    const isValid = is5vs5 ? window.validate5vs5() : window.validate1vs1();

    if (isValid) {
        document.querySelectorAll('.sub-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-payment-proof').style.display = 'flex';
    } else {
        alert("ကျေးဇူးပြု၍ အချက်အလက်အားလုံးကို ပြည့်စုံအောင် ဖြည့်ပေးပါ။");
    }
};
// ၄။ Backend သို့ ပုံတင်ခြင်း (ImgBB API)
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
// ၅။ Registration တင်ခြင်း (Final Submit)
window.submitProof = async function() {
    const is1v1Visible = (currentMode === '1vs1');
    const logoInputId = is1v1Visible ? 'sqLogo1vs1' : 'sqLogo';
    
    const logoInput = document.getElementById(logoInputId);
    const ssInput = document.getElementById('ssFile-proof');

    // Validation
    if (!logoInput || logoInput.files.length === 0 || !ssInput || ssInput.files.length === 0) {
        alert("Logo နှင့် Payment Screenshot တင်ပေးပါ။");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.style.display = 'none';

    try {
        const logoUrl = await uploadToBackend(logoInput.files[0]);
        const screenshotUrl = await uploadToBackend(ssInput.files[0]);
        
        const deviceId = localStorage.getItem('aura_device_id') || 'unknown';
        
        // Payload တည်ဆောက်ခြင်း
        let payload = {
            deviceId: deviceId,
            logo: logoUrl,
            paymentScreenshot: screenshotUrl,
            mode: currentMode,
            updatedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Yangon', hour12: true }) 
        };

        // Data ထည့်ခြင်း (1vs1 vs 5vs5)
        if (is1v1Visible) {
            payload.squadName = document.getElementById('solo-player-name')?.value || 'N/A';
            payload.heroName = document.getElementById('hero-name-input')?.value || 'N/A';
            payload.kpayName = document.getElementById('kpay-name-solo')?.value || 'N/A';
            payload.kpayNo = document.getElementById('kpay-no-solo')?.value || 'N/A';
            payload.entryFee = document.getElementById('fee-1vs1')?.innerText || '0 Ks';
            payload.mlbbId = document.querySelector('#page-1vs1 .player-row input[type="number"]')?.value || 'N/A';
        } else {
            payload.squadName = document.getElementById('squad-name')?.value || 'N/A';
            payload.entryFee = document.getElementById('fee-5vs5')?.innerText || '0 Ks';
            payload.kpayName = document.getElementById('kpay-name')?.value || 'N/A';
            payload.kpayNo = document.getElementById('kpay-no')?.value || 'N/A';
            
            const playerRows = document.querySelectorAll('#page-5vs5 .player-row');
            playerRows.forEach((row, index) => {
                const inputs = row.querySelectorAll('input');
                payload[`player${index + 1}`] = {
                    name: inputs[0].value || 'N/A',
                    id: inputs[1].value || 'N/A'
                };
            });
        }

        // အရင်က /api/update-registration ကို ခေါ်နေတာကို ဒီလိုပြင်ပါ
        const response = await fetch('/api/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('aura_last_registration', JSON.stringify(payload));
            alert("Registration submitted successfully!");
            
            const buyBtn = document.getElementById('buy-room-btn');
            if (buyBtn) {
                buyBtn.innerText = "PENDING..."; 
                buyBtn.style.pointerEvents = "none"; 
                buyBtn.style.opacity = "0.6";
            }
            showWaitingRoom();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alert("Error: " + error.message);
        if (submitBtn) submitBtn.style.display = 'block';
    }
};
function showWaitingRoom() {
    const proofPage = document.getElementById('page-payment-proof');
    if (proofPage) proofPage.style.display = 'none';
    const matchCenter = document.getElementById('page-match-center');
    if (matchCenter) matchCenter.style.display = 'flex';
}
// --- Logo Preview Logic (5vs5) ---
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
// --- Logo Preview Logic (1vs1) ---
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

// --- Screenshot Preview Logic (Common) ---
window.previewScreenshot = function(event) {
    const file = event.target.files[0];
    const img = document.getElementById('ssPreview');
    const placeholder = document.getElementById('ss-placeholder');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};
document.addEventListener('DOMContentLoaded', function() {
    // 5vs5 Logo click (ပုံကိုနှိပ်ရင် ပြန်ရွေးလို့ရအောင်)
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview) {
        logoPreview.addEventListener('click', function() {
            document.getElementById('sqLogo').click();
        });
    }

    // 1vs1 Logo click
    const logoPreview1vs1 = document.getElementById('logoPreview1vs1');
    if (logoPreview1vs1) {
        logoPreview1vs1.addEventListener('click', function() {
            document.getElementById('sqLogo1vs1').click();
        });
    }

    // Screenshot click
    const ssPreview = document.getElementById('ssPreview');
    if (ssPreview) {
        ssPreview.addEventListener('click', function() {
            document.getElementById('ssFile-proof').click();
        });
    }
});
window.nextMap = () => {
    currentIndex = (currentIndex + 1) % mapData.length;
    window.currentMode = mapData[currentIndex].mode; // ဒီ line ပါဖို့လိုတယ်
    updateUI();
};
window.leaveRoom = () => {
    // Page အားလုံးကို ပိတ်
    document.getElementById('page-5vs5').style.display = 'none';
    document.getElementById('page-1vs1').style.display = 'none';
    
    // Room Select Page ပြန်ဖွင့်
    document.getElementById('page-room-select').style.display = 'block';
};
window.goBack = () => {
    // ၁။ ဖွင့်ထားတဲ့ Sub-pages တွေကို အကုန်ဖျောက်မယ်
    const pages = [
        'page-5vs5', 
        'page-1vs1', 
        'page-payment-proof', 
        'page-match-center',
        'page-room-select'
    ];
    
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // ၂။ Main Dashboard ကို ပြန်ပြမယ်
    const mainDashboard = document.getElementById('main-dashboard');
    if (mainDashboard) {
        mainDashboard.style.display = 'block'; // block ပြန်လုပ်ပေးပါ
        mainDashboard.style.opacity = '1';     // opacity ပြန်တက်မယ်
        mainDashboard.style.pointerEvents = 'auto'; // နှိပ်လို့ရအောင် ပြန်လုပ်မယ်
    }

    // ၃။ အရေးကြီးချက် - လက်ရှိ Mode အလိုက် UI ကို Update လုပ်ပေးမယ်
    // (အခုမှ index ပြန်စစ်စရာမလိုဘဲ updateUI() က လက်ရှိ currentIndex အတိုင်း ပြပေးပါလိမ့်မယ်)
    updateUI(); 
};
window.backToRegistration = () => {
    // ၁။ Payment Proof Page ကို ပိတ်မယ်
    const paymentPage = document.getElementById('page-payment-proof');
    if (paymentPage) paymentPage.style.display = 'none';

    // ၂။ လက်ရှိ mode ပေါ်မူတည်ပြီး သက်ဆိုင်ရာ page ကို ပြန်ပြမယ်
    if (window.currentMode === '5vs5') {
        const page5vs5 = document.getElementById('page-5vs5');
        if (page5vs5) page5vs5.style.display = 'block';
    } else if (window.currentMode === '1vs1') {
        const page1vs1 = document.getElementById('page-1vs1');
        if (page1vs1) page1vs1.style.display = 'block';
    }
};
let lastStatus = ''; 
let isResubmitMode = false; // RESUBMIT NOW ရောက်သွားပြီလား စစ်ရန် flag

async function updateBuyButtonStatus() {
    const deviceId = localStorage.getItem('aura_device_id');
    const buyBtn = document.getElementById('buy-room-btn');
    const actionBtns = document.getElementById('action-buttons'); 
    const backBtn = document.getElementById('back-btn');
    const buyRoomContainer = document.getElementById('buy-room-container');

    if (!deviceId || !buyBtn) return;

    try {
        const response = await fetch('/api/check-status?deviceId=' + encodeURIComponent(deviceId));
        if (response.status === 404) return;

        const data = await response.json();
        
// ၁။ CONFIRM ဖြစ်နေရင်
        if (data.status === 'confirm') {
            buyBtn.style.display = 'none';
            if (backBtn) backBtn.style.display = 'none';
            if (buyRoomContainer) buyRoomContainer.style.display = 'none';
            
            // Action Wheel (သို့မဟုတ် actionBtns) ပေါ်လာစေရန်
            const actionWheelContainer = document.getElementById('action-wheel-container');
            if (actionWheelContainer) {
                actionWheelContainer.style.display = 'block';
            }
            if (actionBtns) {
                actionBtns.style.display = 'flex';
            }
            
            // (Optional) Database ကနေ user ရဲ့ key_status ကိုပါ တစ်ခါတည်း စစ်ပြီး 
            // Action Wheel ရဲ့ Icon နဲ့ State တွေကို ချိန်ညှိချင်ရင် ဒီမှာ function ထပ်ခေါ်လို့ရပါတယ်
            // updateWheelUI(data.keyStatus); 
        }        
        // REJECT ဖြစ်တဲ့အပိုင်း
        else if (data.status === 'reject') {
            // အကယ်၍ user က RESUBMIT NOW ကို ရောက်နေပြီဆိုရင် ၅ စက္ကန့်တစ်ကြိမ် အလိုအလျောက် ပြန်မပြောင်းစေရန် တားမည်
            if (isResubmitMode) return; 

            if (actionBtns) actionBtns.style.display = 'none';
            if (buyRoomContainer) buyRoomContainer.style.display = 'flex'; 

            buyBtn.style.display = 'block';
            if (backBtn) backBtn.style.display = 'block';
            
            // REJECTED ဖြစ်နေချိန် ပုံစံ
            buyBtn.innerText = "REJECTED";
            buyBtn.style.backgroundColor = "#eb3838";
            buyBtn.style.opacity = "1"; 
            buyBtn.style.boxShadow = "0 0 8px rgba(235, 56, 56, 0.4)";
            buyBtn.style.pointerEvents = "auto";
            
            buyBtn.onclick = () => {
                alert(`❌ Reject ဖြစ်ရသည့်အကြောင်းရင်း:\n${data.rejectReason || 'မဖော်ပြထားပါ'}`);
                
                // RESUBMIT NOW သို့ ပြောင်းသွားပြီဖြစ်ကြောင်း flag ကို true လုပ်မည်
                isResubmitMode = true; 

                buyBtn.innerText = "RESUBMIT NOW";
                buyBtn.style.backgroundColor = "#dac02d";
                buyBtn.style.color = "#000";
                buyBtn.style.boxShadow = "0 0 10px rgba(218, 192, 45, 0.5)";
                buyBtn.style.fontWeight = "bold";
                
                buyBtn.onclick = () => {
                    openRegistrationPage();
                };
            };
        }
        // ၃။ PENDING ဖြစ်နေရင်
        else {
            if (actionBtns) actionBtns.style.display = 'none';
            if (buyRoomContainer) buyRoomContainer.style.display = 'flex'; // Pending မှာလည်း flex သုံးပေးပါ
            if (backBtn) backBtn.style.display = 'block';
            
            buyBtn.style.display = 'block';
            buyBtn.innerText = "PENDING...";
            buyBtn.style.backgroundColor = "#555555";
            buyBtn.style.pointerEvents = "none";
        }

        lastStatus = data.status;
    } catch (e) {
        console.error("Status check failed:", e);
    }
}

// Registration Page ကို SPA ပုံစံဖြင့် ပြန်ဖွင့်ပေးမည့် function
window.openRegistrationPage = () => {
    // ၁။ UI ပေါ်ရှိ Page များအားလုံးကို ဖျောက်ပါ
    document.querySelectorAll('.sub-page, #page-match-center, #main-dashboard').forEach(el => {
        el.style.display = 'none';
    });

    // ၂။ လက်ရှိ mode ပေါ်မူတည်ပြီး သက်ဆိုင်ရာ registration page ကို ပြန်ပြပါ
    if (window.currentMode === '5vs5') {
        const page5vs5 = document.getElementById('page-5vs5');
        if (page5vs5) page5vs5.style.display = 'block';
    } else {
        const page1vs1 = document.getElementById('page-1vs1');
        if (page1vs1) page1vs1.style.display = 'block';
    }

    // ၃။ Submit Button ကို ပြန်ပြပေးပါ (Reject ဖြစ်ပြီး ပြန်ပြင်တဲ့အခါ ပေါ်လာစေရန်)
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.style.display = 'block'; 
    }
    
    // (Optional) အချက်အလက်ဟောင်းများ ပြန်တင်လိုလျှင် ဤနေရာတွင် ထည့်ပါ
    // if (typeof loadSavedData === 'function') loadSavedData();
};
document.addEventListener('DOMContentLoaded', () => {
    updateBuyButtonStatus();
    setInterval(updateBuyButtonStatus, 5000); 
});
let isWheelOpen = false; // အစမှာ ကျုံ့ထားသောပုံစံဖြင့် စတင်ပြသမည်

window.toggleActionWheel = function() {
    isWheelOpen = !isWheelOpen;
    
    const actionWrapper = document.getElementById('dock-action-wrapper');
    const dockBox = document.getElementById('dock-box');
    const externalBackBtn = document.getElementById('dock-external-back-btn');

    if (isWheelOpen) {
        // ၁။ ညာဘက် Back Button ကို ဖြည်းဖြည်းချင်း width နှင့် opacity လျှော့ချပြီး ကျုံ့ဖျောက်မည်
        if (externalBackBtn) {
            externalBackBtn.style.opacity = '0';
            externalBackBtn.style.width = '0px';
            externalBackBtn.style.minWidth = '0px';
            externalBackBtn.style.padding = '0px';
            externalBackBtn.style.borderWidth = '0px';
            externalBackBtn.style.marginRight = '0px';
            setTimeout(() => {
                externalBackBtn.style.display = 'none';
            }, 400); // Animation ပြီးမှ display none လုပ်မည်
        }
        // ၂။ ရွှေရောင်ဘောင်ကို အလျားပြည့် ရှည်ထွက်စေမည်
        if (dockBox) {
            dockBox.style.width = '100%';
            dockBox.style.padding = '12px 18px';
            dockBox.style.justifyContent = 'space-between';
        }
        // ၃။ အတွင်းရှိ လုပ်ဆောင်ချက် ခလုတ်များကို ပေါ်လာစေမည်
        if (actionWrapper) {
            actionWrapper.style.visibility = 'visible';
            actionWrapper.style.opacity = '1';
        }
    } else {
        // ၁။ အတွင်းရှိ လုပ်ဆောင်ချက် ခလုတ်များကို အရင် ဖျောက်မည်
        if (actionWrapper) {
            actionWrapper.style.opacity = '0';
            actionWrapper.style.visibility = 'hidden';
        }
        // ၂။ ရွှေရောင်ဘောင်ကို မူလအရွယ်အစားသို့ ပြန်ကျုံ့စေမည်
        if (dockBox) {
            dockBox.style.width = '185px';
            dockBox.style.padding = '12px 14px';
            dockBox.style.justifyContent = 'flex-start';
        }
        // ၃။ ကျုံ့သွားပြီးချိန်တွင် ညာဘက် Back Button ကို ဖြည်းဖြည်းချင်း အကျယ်ပြန် விரிထွက်ပေါ်လာစေမည်
        if (externalBackBtn) {
            externalBackBtn.style.display = 'flex';
            setTimeout(() => {
                externalBackBtn.style.width = '100px';
                externalBackBtn.style.minWidth = '';
                externalBackBtn.style.padding = '0';
                externalBackBtn.style.borderWidth = '1px';
                externalBackBtn.style.marginRight = '';
                externalBackBtn.style.opacity = '1';
            }, 50);
        }
    }
}