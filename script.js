// script.js
import { performLogin } from './auth.js';
import { showDashboard, setupWelcomeModal, initGuideSwiper, openGuide, toggleGuide } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
    initGuideSwiper();
});

// Login အတွက်
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

// Guide အတွက် (သင့် HTML က onclick="openGuide()" ဖြစ်နေလို့ window.openGuide လို့ သုံးပေးရပါမယ်)
window.openGuide = () => {
    // mapData နှင့် currentIndex တို့သည် ဤဖိုင် (script.js) ထဲတွင် ရှိနေရပါမည်
    // အကယ်၍ တခြားဖိုင်တွင်ရှိပါက ထိုဖိုင်မှ import လုပ်ပါ
    openGuide(mapData, currentIndex); 
};

// CLOSE ခလုတ်အတွက်
window.toggleGuide = (show) => {
    toggleGuide(show);
};