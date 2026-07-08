// script.js
import { performLogin } from './auth.js';
import { showDashboard, setupWelcomeModal } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
});

// HTML ထဲက onclick အတွက် ဒီလိုင်းလေးထည့်ပါ
window.handleLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);

    const result = await performLogin(phoneNumber, deviceId);
    
    if (result.ok) {
        alert("Login Successful!");
        showDashboard();
    } else {
        alert("Error: " + result.data.message);
    }
};