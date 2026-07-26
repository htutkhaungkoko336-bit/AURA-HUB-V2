const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    }) 
  : getApps()[0];

const db = getFirestore(app);

module.exports = async function handler(req, res) {
    // 1️⃣ GET Method - Room များကို ဆွဲထုတ်ရန်
    if (req.method === 'GET') {
        try {
            const roomsSnapshot = await db.collection('rooms').where('status', '==', 'waiting').get();
            let roomList = [];

            for (const doc of roomsSnapshot.docs) {
                let roomData = doc.data();
                
                const regSnapshot = await db.collection('registrations')
                    .where('deviceId', '==', roomData.hostDeviceId)
                    .get();

                let regData = {};
                if (!regSnapshot.empty) {
                    regData = regSnapshot.docs[0].data();
                }

                roomList.push({
                    roomId: doc.id,
                    deviceId: roomData.hostDeviceId,
                    logo: regData.logo || roomData.logo || '',
                    squadName: regData.squadName || roomData.teamName || 'My Team',
                    heroName: regData.heroName || roomData.heroName || '',
                    playerName: regData.playerName || roomData.playerName || '',
                    mode: roomData.mode || '5vs5',
                    entryFee: regData.entryFee || roomData.entryFee || '0',
                    status: roomData.status,
                    contact: regData.contact || roomData.contact || '' // 🌟 Popup ထဲတွင် ပေါ်ရန် contact ပါ ထည့်ပေးလိုက်သည်
                });
            }

            return res.status(200).json({ success: true, rooms: roomList });
        } catch (error) {
            console.error("Error fetching rooms:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    // 2️⃣ POST Method - Contact သို့မဟုတ် Registration အချက်အလက်များ Update လုပ်ရန် / Register လုပ်ရန်
    if (req.method === 'POST') {
        try {
            const data = req.body;
            const deviceId = data.deviceId;

            if (!deviceId) {
                return res.status(400).json({ success: false, message: "Device ID is required" });
            }

            // registrations collection ထဲတွင် ဤ deviceId ရှိနှင့်ပြီးသားလား ရှာမည်
            const regRef = db.collection('registrations');
            const snapshot = await regRef.where('deviceId', '==', deviceId).get();

            let dbData = {
                deviceId: deviceId,
                updatedAt: new Date().toISOString()
            };

            // Request ထဲမှ ပါလာသော data များကို ထည့်သွင်းခြင်း
            if (data.logo) dbData.logo = data.logo;
            if (data.paymentScreenshot) dbData.paymentScreenshot = data.paymentScreenshot;
            if (data.mode) dbData.mode = data.mode;
            if (data.squadName) dbData.squadName = data.squadName;
            if (data.heroName) dbData.heroName = data.heroName;
            if (data.playerName) dbData.playerName = data.playerName;
            if (data.entryFee) dbData.entryFee = data.entryFee;

            // 🌟 သင်တောင်းဆိုထားသော Contact ပါလာပါက dbData ထဲသို့ ထည့်သွင်းခြင်း
            if (data.contact) {
                dbData.contact = data.contact;
            }

            if (!snapshot.empty) {
                // ရှိပြီးသားဆိုလျှင် Update လုပ်မည် (Existing Document ကို Merge လုပ်ခြင်း)
                const docId = snapshot.docs[0].id;
                await regRef.doc(docId).set(dbData, { merge: true });
            } else {
                // အသစ်ဆိုလျှင် အသစ်ထည့်မည်
                await regRef.add(dbData);
            }

            return res.status(200).json({ success: true, message: "Successfully updated" });
        } catch (error) {
            console.error("Error updating registration/contact:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    // အခြား Method များအတွက် 405 Method Not Allowed ပြန်မည်
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
};