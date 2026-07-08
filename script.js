// script.js
import { performLogin } from './auth.js';
import { showDashboard, setupWelcomeModal } from './ui.js';
import { initGuideSwiper, openGuide, toggleGuide } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
    initGuideSwiper();
});

// window အောက်မှာ ထည့်ပေးလိုက်ခြင်းဖြင့် HTML ထဲက onclick က ခေါ်လို့ရသွားပါပြီ
window.registerOrLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);

    console.log("Button clicked, number:", phoneNumber);

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
window.viewGuide = () => {
    openGuide(mapData, currentIndex); 
};

window.toggleGuide = toggleGuide;