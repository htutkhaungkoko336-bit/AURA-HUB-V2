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
// main-dashboard ကနေ waiting room ကို သွားတဲ့ function gotoroom ကို ui မှာ export လုပ်ပြီး script.js မှာ import လုပ်ထားပါတယ် window.goToRooms = goToRooms;
export function goToRooms() {
    // ၁။ လက်ရှိ main-dashboard ကို ဖျောက်ရန်
    document.getElementById('main-dashboard').style.display = 'none';

    // ၂။ ခေါ်ချင်တဲ့ page-match-center ကို ပြသရန်
    const matchCenter = document.getElementById('page-match-center');
    matchCenter.style.display = 'flex';

    // ၃။ Action Buttons ကို ဖျောက်ပြီး Buy Room Container ကို ပြရန်
    const actionBtns = document.getElementById('action-buttons');
    const buyRoomContainer = document.getElementById('buy-room-container');

    if (actionBtns) {
        actionBtns.style.display = 'none'; // Action Buttons ဖျောက်မည်
    }
    
    if (buyRoomContainer) {
        buyRoomContainer.style.display = 'flex'; // Buy Room Container ပြမည်
    }
}
// main-dashboard ကနေ waiting room ကို သွားတဲ့ function
