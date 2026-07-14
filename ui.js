// ui.js (ဒီပုံစံအတိုင်း စုစည်းထားပါ)
export function showDashboard() {
    const loginPage = document.getElementById("page-login");
    const dashboard = document.getElementById("main-dashboard");
    const roomSelect = document.getElementById("page-room-select");

    // Dashboard ပြန်ပေါ်စေရန်
    if (dashboard) {
        dashboard.style.display = "block";
        dashboard.style.opacity = "1";
        dashboard.style.pointerEvents = "auto";
    }
    // Room Select ပိတ်ရန်
    if (roomSelect) roomSelect.style.display = "none";
    // Login page ပိတ်ရန်
    if (loginPage) loginPage.style.display = "none";

    console.log("Dashboard is now active!");
}

export function showRoomSelect(mode) {
    document.getElementById("main-dashboard").style.display = "none";
    document.getElementById("page-room-select").style.display = "block";
    document.getElementById("selected-mode-title").innerText = `${mode} MODE`;
}

export function setupWelcomeModal() {
    const checkbox = document.getElementById('welcomeCheckbox');
    const enterBtn = document.getElementById('welcomeAgreeBtn');

    checkbox.addEventListener('change', function() {
        enterBtn.disabled = !this.checked;
        enterBtn.style.cursor = this.checked ? 'pointer' : 'not-allowed';
        enterBtn.style.background = this.checked ? '#c9a66b' : '#333';
        enterBtn.style.color = this.checked ? '#000' : '#c9a66b';
    });

    enterBtn.addEventListener('click', function() {
        document.getElementById('welcomeModal').style.display = 'none';
    });
}
// ui.js
let guideSwiper; 

export function initGuideSwiper() {
    guideSwiper = new Swiper('.swiper', {
        loop: false,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            slideChange: function () {
                checkButtons(this);
            }
        }
    });
}

function checkButtons(swiper) {
    const nextBtn = document.querySelector('.swiper-button-next');
    const prevBtn = document.querySelector('.swiper-button-prev');
    
    if (nextBtn && prevBtn) {
        nextBtn.style.opacity = swiper.isEnd ? '0.3' : '1';
        nextBtn.style.pointerEvents = swiper.isEnd ? 'none' : 'auto';
        prevBtn.style.opacity = swiper.isBeginning ? '0.3' : '1';
        prevBtn.style.pointerEvents = swiper.isBeginning ? 'none' : 'auto';
    }
}

// ui.js
export function openGuide(mapData, currentIndex) {
    if (!guideSwiper) return;

    const overlay = document.getElementById("user-guide-overlay");
    const currentMode = mapData[currentIndex].mode; 

    // Mode အလိုက် ပုံစာရင်းခွဲခြင်း
    const images = (currentMode === '5vs5') 
        ? ['5vs5.png', '52.jpg', '53.jpg', '54.jpg', '55.jpg', '56.jpg', '57.jpg', '58.jpg'] 
        : ['1vs1.png', '1v1_2.jpg', '1v1_3.jpg', '1v1_4.jpg', '1v1_5.jpg'];

    guideSwiper.removeAllSlides(); 
    images.forEach(src => {
        // ပုံကို swiper ထဲထည့်ခြင်း
        guideSwiper.appendSlide(`<div class="swiper-slide"><img src="${src}" style="width:100%"></div>`);
    });

    overlay.style.display = "flex";
    guideSwiper.update(); 
    guideSwiper.slideTo(0);
    checkButtons(guideSwiper);
}

export function toggleGuide(show = false) {
    document.getElementById("user-guide-overlay").style.display = show ? "flex" : "none";
}

// Global variable များ
let pollingInterval;

// ၁။ Waiting Room သို့ ပြောင်းခြင်း
export function showWaitingRoom() {
    const paymentPage = document.getElementById('page-payment-proof');
    if (paymentPage) paymentPage.style.display = 'none';

    const matchCenter = document.getElementById('page-match-center');
    if (matchCenter) matchCenter.style.display = 'flex';

    // ခလုတ်တွေကို အရင်ဖျောက်ထားမယ်
    const actionButtons = document.getElementById('action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';

    // Waiting စာသားပြမယ်
    const matchContent = document.getElementById('match-content');
    if (matchContent) {
        matchContent.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #c9a66b;">
                <h2>⏳ Registration ကို Admin မှ စစ်ဆေးနေပါသည်။</h2>
            </div>`;
    }

    // Polling စတင်မည်
    startStatusPolling();
}

// ၂။ Polling စတင်ခြင်း (Admin အတည်ပြုချက်စောင့်ရန်)
export function startStatusPolling() {
    // အရင်ရှိနေတဲ့ interval ကို ရှင်းမယ်
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        const docId = localStorage.getItem('myDocId');
        if (!docId) return;

        try {
            const response = await fetch(`/api/check-status?id=${docId}`);
            const data = await response.json();

            if (data.status === 'confirm') {
                enableButtons();
                localStorage.setItem('reg_status', 'confirm');
                clearInterval(pollingInterval);
            }
        } catch (error) {
            console.error("Polling Error:", error);
        }
    }, 5000); // ၅ စက္ကန့်တိုင်း စစ်မယ်
}

// ၃။ Confirm ဖြစ်မှ ခလုတ်ကို ပြန်ဖော်ပေးမယ့် Function
export function enableButtons() {
    const actionButtons = document.getElementById('action-buttons');
    if (actionButtons) actionButtons.style.display = 'flex';
    
    const matchContent = document.getElementById('match-content');
    if (matchContent) {
        matchContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #4caf50;">
                <h2>✅ Registration Confirmed!</h2>
                <p>သင်၏ပွဲစဉ်ကို Admin မှ အတည်ပြုပေးလိုက်ပါပြီ။</p>
            </div>`;
    }
}

// ၄။ Tab ပြောင်းပေးမည့် Function
window.switchTab = function(tabName, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    const content = document.getElementById('match-content');
    const savedStatus = localStorage.getItem('reg_status');

    switch(tabName) {
        case 'waiting':
            if (savedStatus === 'confirm') {
                enableButtons();
            } else {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #c9a66b;">
                        <h3>⏳ Admin စစ်ဆေးနေပါသည်</h3>
                        <p>ခဏစောင့်ပေးပါ။</p>
                    </div>`;
            }
            break;
        case 'playing':
            content.innerHTML = `<div style="color: #fff; padding: 20px;"><h3>⚔️ Playing Room</h3><p>လက်ရှိ ပွဲစဉ်များ မရှိသေးပါ။</p></div>`;
            break;
        case 'result':
            content.innerHTML = `<div style="color: #fff; padding: 20px;"><h3>🏆 Match Results</h3><p>ပြီးခဲ့သော ပွဲစဉ် ရလဒ်များ မရှိသေးပါ။</p></div>`;
            break;
    }
}

export function initTabs() {
    const tabs = [
        { id: 'tab-waiting', name: 'waiting' },
        { id: 'tab-playing', name: 'playing' },
        { id: 'tab-result', name: 'result' }
    ];

    tabs.forEach(tab => {
        const btn = document.getElementById(tab.id);
        if (btn) {
            btn.addEventListener('click', (e) => switchTab(tab.name, e.target));
        }
    });
}

// App စတင်သောအခါ
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
});