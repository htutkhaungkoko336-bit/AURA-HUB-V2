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