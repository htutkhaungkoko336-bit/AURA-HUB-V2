// auth.js
export async function performLogin(phoneNumber, deviceId) {
    try {
        const response = await fetch('api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber, deviceId: deviceId })
        });

        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error("Login Error:", error);
        return { ok: false, data: { message: "Server error occurred" } };
    }
}