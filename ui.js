// ui.js
export function showDashboard() {
    const loginPage = document.getElementById("page-login");
    const dashboard = document.getElementById("main-dashboard");
    
    if (loginPage) loginPage.style.display = "none";
    if (dashboard) {
        dashboard.style.opacity = "1";
        dashboard.style.pointerEvents = "auto";
        dashboard.style.display = "flex";
        dashboard.style.flexDirection = "column";
        console.log("Dashboard is now active!");
    }
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
        ? ['51.jpg', '52.jpg', '53.jpg', '54.jpg', '55.jpg', '56.jpg', '57.jpg', '58.jpg'] 
        : ['1v1_1.jpg', '1v1_2.jpg', '1v1_3.jpg', '1v1_4.jpg', '1v1_5.jpg'];

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