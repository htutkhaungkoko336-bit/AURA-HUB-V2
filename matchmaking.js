// matchmaking.js

export function joinOrViewRoom(roomDocId, roomDataStr) {
    let roomData = roomDataStr;
    
    // အကယ်၍ string ပုံစံရောက်လာရင် object ပြန်ပြောင်းရန်
    if (typeof roomDataStr === 'string') {
        try {
            roomData = JSON.parse(decodeURIComponent(roomDataStr));
        } catch (e) {
            try {
                roomData = JSON.parse(roomDataStr);
            } catch (err) {
                console.error("Room data parse error:", err);
            }
        }
    }
    
    // Data မမှန်ကန်ပါက သတိပေးပြီး ရပ်တန့်ရန်
    if (!roomData || typeof roomData !== 'object') {
        alert("❌ Room အချက်အလက် မမှန်ကန်ပါ။");
        return;
    }
    
    joinMatchRoom(roomDocId, roomData);
}

export async function joinMatchRoom(roomDocId, roomData) {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) {
        alert("Device ID မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Login ပြန်ဝင်ပါ။");
        return;
    }

    const registrationData = JSON.parse(localStorage.getItem('aura_last_registration'));
    if (!registrationData) {
        alert("ကျေးဇူးပြု၍ ပထမဦးစွာ Registration လုပ်ပေးပါ။");
        return;
    }

    // roomData သို့မဟုတ် property များ မပါလာပါက အမှားမတက်အောင် စစ်ဆေးခြင်း
    if (!roomData || !roomData.mode || !roomData.entryFee) {
        alert("❌ Room အချက်အလက်များ မပြည့်စုံပါ။");
        return;
    }

    // Mode တူမတူ စစ်ဆေးခြင်း
    if (registrationData.mode !== roomData.mode) {
        alert(`❌ Mode မကိုက်ညီပါ။ ဤ Room သည် ${roomData.mode} Mode ဖြစ်ပါသည်။`);
        return;
    }

    // Entry Fee နှုန်းထား တူမတူ စစ်ဆေးခြင်း
    if (registrationData.entryFee !== roomData.entryFee) {
        alert(`❌ Entry Fee နှုန်းထား မကိုက်ညီပါ။ (${roomData.entryFee} သာ လက်ခံသည်)`);
        return;
    }

    // ကိုယ့်အခန်း ကိုယ်ပြန် join တာကို တားမြစ်ခြင်း
    if (roomData.hostDeviceId === deviceId) {
        alert("⚠️ မိမိဖန်တီးထားသော Room ကို မိမိပြန် join ၍ မရပါ။");
        return;
    }

    try {
        // 1vs1 ဖြစ်လျှင် squadName ကို playerName အဖြစ် သတ်မှတ်ပေးရန်
        const formattedJoinerData = {
            ...registrationData,
            playerName: registrationData.playerName || registrationData.squadName || ""
        };

        const response = await fetch('/api/join-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId: deviceId,
                roomId: roomDocId,
                joinerData: formattedJoinerData
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("🎉 Match ဝင်ရောက်အောင်မြင်ပါပြီ!");
            handlePostJoinUI();
        } else {
            throw new Error(result.error || result.message);
        }
    } catch (error) {
        alert("Join လုပ်၍ မရပါ: " + error.message);
    }
}

function handlePostJoinUI() {
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) createBtn.style.display = 'none';

    const refundSection = document.getElementById('refund-section');
    if (refundSection) refundSection.style.display = 'block';

    if (typeof switchToPlayingTab === 'function') {
        switchToPlayingTab();
    }
}

// matchmaking.js

let currentSelectedMatchId = null;

// --- ၁. Playing Tab သို့ ပြောင်းလဲသည့် လုပ်ဆောင်ချက် ---
export function switchToPlayingTab() {
    // အခြား Tab တွေကို ဖျောက်ပြီး Playing Lobby ကို ပြရန်
    document.querySelectorAll('.sub-page').forEach(page => page.style.display = 'none');
    const playingLobby = document.getElementById('page-playing-lobby');
    if (playingLobby) playingLobby.style.display = 'flex';

    // Matches များကို စတင် နားထောင်ရန် (Realtime Listener)
    listenUserMatches();
}

// --- ၂. Firestore မှ ကိုယ့် Match များကို Realtime ဖြင့် ဆွဲထုတ်ခြင်း ---
export function listenUserMatches() {
    const deviceId = localStorage.getItem('aura_device_id');
    if (!deviceId) return;

    db.collection('matches')
      .where('status', 'in', ['pending_confirmation', 'matched', 'ready'])
      .onSnapshot((snapshot) => {
          const container = document.getElementById('room-cards-container');
          if (!container) return;
          container.innerHTML = '';

          let foundMatch = false;

          snapshot.forEach((doc) => {
              const match = doc.data();
              const matchId = doc.id;

              // Host သို့မဟုတ် Joiner တစ်ဦးဦးဖြစ်မှ ပြမည်
              if (match.host.deviceId === deviceId || match.joiner.deviceId === deviceId) {
                  foundMatch = true;
                  renderRoomCard(matchId, match, container);
              }
          });

          if (!foundMatch) {
              container.innerHTML = `<div style="text-align: center; color: #666; margin-top: 40px; font-size: 0.85rem;">လက်တလော Active ဖြစ်နေသော Room များ မရှိသေးပါ။</div>`;
          }
      });
}

// --- ၃. Room Card တစ်ခုချင်းစီကို UI ပေါ် တည်ဆောက်ခြင်း ---
export function renderRoomCard(matchId, match, container) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = 'background: rgba(201,166,107,0.05); border: 1px solid #333; border-radius: 12px; padding: 15px; cursor: pointer; position: relative; transition: 0.2s;';
    
    card.onmouseover = () => card.style.borderColor = '#c9a66b';
    card.onmouseout = () => card.style.borderColor = '#333';
    card.onclick = () => openMatchDetailModal(matchId, match);

    card.innerHTML = `
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
            <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${match.entryFee || 'Free'}</span>
            <span style="background: #222; color: #c9a66b; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #444;">${match.mode || '1vs1'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="text-align: center; width: 40%;">
                <img src="${match.host.logo || 'https://i.ibb.co/4pGm0Zf/default-logo.png'}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #c9a66b; object-fit: cover;">
                <div style="font-size: 0.8rem; color: #f1e4b9; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.host.teamName}</div>
            </div>
            <div style="font-weight: bold; color: #c9a66b; font-size: 0.9rem;">VS</div>
            <div style="text-align: center; width: 40%;">
                <img src="${match.joiner.logo || 'https://i.ibb.co/4pGm0Zf/default-logo.png'}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #444; object-fit: cover;">
                <div style="font-size: 0.8rem; color: #f1e4b9; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.joiner.teamName}</div>
            </div>
        </div>
    `;
    container.appendChild(card);
}

// --- ၄. Room Card ကို နှိပ်လျှင် Popup Modal ပွင့်လာပြီး Data ထည့်ပေးခြင်း ---
export function openMatchDetailModal(matchId, match) {
    currentSelectedMatchId = matchId;
    const modal = document.getElementById('match-detail-popup');
    if (!modal) return;

    // Header Tags
    document.getElementById('popup-entry-fee').innerText = match.entryFee || 'Free';
    document.getElementById('popup-mode').innerText = match.mode || '1vs1';

    // Team A (Host) Info
    document.getElementById('popup-team-a-logo').src = match.host.logo || 'https://i.ibb.co/4pGm0Zf/default-logo.png';
    document.getElementById('popup-team-a-name').innerText = match.host.teamName || 'Host';
    
    // Team B (Joiner) Info
    document.getElementById('popup-team-b-logo').src = match.joiner.logo || 'https://i.ibb.co/4pGm0Zf/default-logo.png';
    document.getElementById('popup-team-b-name').innerText = match.joiner.teamName || 'Joiner';

    // Ready Status Badges (Green Indicator)
    document.getElementById('popup-team-a-ready').style.display = match.host.confirmed ? 'block' : 'none';
    document.getElementById('popup-team-b-ready').style.display = match.joiner.confirmed ? 'block' : 'none';

    // Players List Render (5vs5 သို့မဟုတ် 1vs1 အပေါ်မူတည်၍ ပြရန်)
    renderPlayersList('popup-team-a-players', match.host, match.mode);
    renderPlayersList('popup-team-b-players', match.joiner, match.mode);

    modal.style.display = 'flex';
}

// --- ၅. Player စာရင်းများကို ဖော်ပြရန် Helper Function ---
export function renderPlayersList(containerId, teamData, mode) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (mode === '1vs1') {
        container.innerHTML = `<div>👤 ${teamData.playerName || teamData.teamName}</div>`;
    } else {
        const players = teamData.players || [teamData.playerName || teamData.teamName];
        players.forEach((p, idx) => {
            const playerName = typeof p === 'object' ? p.name : p;
            container.innerHTML += `<div>Player ${idx + 1}: ${playerName || '-'}</div>`;
        });
    }
}

// --- ၆. Confirm / Ready လုပ်ဆောင်ချက် ---
export async function setReadyFromPopup() {
    if (!currentSelectedMatchId) return;
    const deviceId = localStorage.getItem('aura_device_id');

    try {
        const matchRef = db.collection('matches').doc(currentSelectedMatchId);
        const matchDoc = await matchRef.get();
        if (!matchDoc.exists) return;

        const matchData = matchDoc.data();
        let updateData = {};

        if (matchData.host.deviceId === deviceId) {
            updateData['host.confirmed'] = true;
        } else if (matchData.joiner.deviceId === deviceId) {
            updateData['joiner.confirmed'] = true;
        }

        await matchRef.update(updateData);
        alert("✅ Ready အောင်မြင်ပါသည်။");
        document.getElementById('match-detail-popup').style.display = 'none';
    } catch (error) {
        console.error("Ready Error:", error);
        alert("အမှားအယွင်းရှိနေပါသည်: " + error.message);
    }
}

// --- ၇. Match ဖျက်သိမ်းခြင်း ---
export async function cancelMatchFromPopup() {
    if (!currentSelectedMatchId) return;
    if (!confirm("ဤ Match ကို ဖျက်သိမ်းရန် သေချာပါသလား?")) return;

    try {
        await db.collection('matches').doc(currentSelectedMatchId).delete();
        alert("❌ Match ကို ဖျက်သိမ်းပြီးပါပြီ။");
        document.getElementById('match-detail-popup').style.display = 'none';
    } catch (error) {
        console.error("Cancel Error:", error);
    }
}