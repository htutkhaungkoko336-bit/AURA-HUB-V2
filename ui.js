let guideSwiper;

export function initGuideSwiper() {
    guideSwiper = new Swiper('.swiper', {
        loop: false,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        on: { slideChange: function () { checkButtons(this); } }
    });
}

function checkButtons(swiper) {
    const nextBtn = document.querySelector('.swiper-button-next');
    const prevBtn = document.querySelector('.swiper-button-prev');
    if (nextBtn && prevBtn) {
        nextBtn.style.opacity = swiper.isEnd ? '0.3' : '1';
        prevBtn.style.opacity = swiper.isBeginning ? '0.3' : '1';
    }
}

export function showDashboard() {
    document.getElementById("main-dashboard").style.display = "block";
    document.getElementById("page-room-select").style.display = "none";
}

export function showRoomSelect(mode) {
    document.getElementById("main-dashboard").style.display = "none";
    document.getElementById("page-room-select").style.display = "block";
    document.getElementById("selected-mode-title").innerText = `${mode} MODE`;
}

export function openGuide(mapData, currentIndex) {
    const overlay = document.getElementById("user-guide-overlay");
    const currentMode = mapData[currentIndex].mode;
    const images = (currentMode === '5vs5') 
        ? ['5vs5.png', '52.jpg', '53.jpg', '54.jpg', '55.jpg'] 
        : ['1vs1.png', '1v1_2.jpg', '1v1_3.jpg'];
    guideSwiper.removeAllSlides();
    images.forEach(src => guideSwiper.appendSlide(`<div class="swiper-slide"><img src="${src}" style="width:100%"></div>`));
    overlay.style.display = "flex";
    guideSwiper.update();
}

export function toggleGuide(show = false) {
    document.getElementById("user-guide-overlay").style.display = show ? "flex" : "none";
}

export function setupWelcomeModal() {
    const checkbox = document.getElementById('welcomeCheckbox');
    const enterBtn = document.getElementById('welcomeAgreeBtn');
    checkbox.addEventListener('change', function() {
        enterBtn.disabled = !this.checked;
    });
    enterBtn.addEventListener('click', () => document.getElementById('welcomeModal').style.display = 'none');
}