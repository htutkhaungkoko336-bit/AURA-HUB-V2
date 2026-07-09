import { performLogin } from './auth.js';
import { 
    showDashboard, setupWelcomeModal, initGuideSwiper, 
    openGuide, toggleGuide, showRoomSelect 
} from './ui.js';

let currentIndex = 0;
const mapData = [
    { mode: '5vs5', img: '5vs5.png', title: '5vs5 Preview', teams: 5 },
    { mode: '1v1', img: '1v1.png', title: '1v1 Preview', teams: 1 }
];

document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
    initGuideSwiper();
});

window.registerOrLogin = async (phoneNumber) => {
    let deviceId = localStorage.getItem('aura_device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
    localStorage.setItem('aura_device_id', deviceId);
    if (!phoneNumber) { alert("ဖုန်းနံပါတ်ထည့်ပေးပါ။"); return; }
    const result = await performLogin(phoneNumber, deviceId);
    if (result.ok) { alert("Login Successful!"); showDashboard(); }
    else { alert("Error: " + result.data.message); }
};

window.openGuide = () => openGuide(mapData, currentIndex);
window.toggleGuide = toggleGuide;
window.nextMap = () => { currentIndex = (currentIndex + 1) % mapData.length; updateUI(); };
window.goToRooms = () => showRoomSelect(mapData[currentIndex].mode);
window.goBack = () => showDashboard();

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
        const players = Array.from({length: 5}, (_, i) => `<div class="team">Player ${i + 1}</div>`).join('');
        sideA.innerHTML = players;
        sideB.innerHTML = players;
    }
}