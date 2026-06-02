import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import QRCodeImage from 'qrcode';
import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';

const app = express();
app.use(bodyParser.json());

let sock = null;
let isConnected = false;

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();
        
        sock = makeWASocket({
            auth: state,
            version,
            browser: ['Windows', 'Chrome', '110.0.5481.177'],
            logger: pino({ level: 'silent' })
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                console.log('\n--- WHATSAPP BAGLANTI QR KODU ---');
                qrcode.generate(qr, { small: true });
                console.log('---------------------------------\n');

                const destPath = 'e:\\projelerim\\askida\\qr.png';
                QRCodeImage.toFile(destPath, qr, {
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    },
                    width: 350
                }, (err) => {
                    if (err) console.error('QR png olusturma hatasi:', err);
                    else console.log('QR png basariyla kaydedildi ->', destPath);
                });
            }
            
            if (connection === 'close') {
                const lastDisconnectError = lastDisconnect?.error;
                const statusCode = lastDisconnectError?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`Baglanti kapandi (Sebep: ${statusCode}). Yeniden baglaniyor: ${shouldReconnect} (3sn sonra)`);
                isConnected = false;
                if (shouldReconnect) {
                    setTimeout(connectToWhatsApp, 3000);
                }
            } else if (connection === 'open') {
                console.log('\n======================================');
                console.log('🎉 WHATSAPP BAGLANTISI BASARIYLA ACILDI!');
                console.log('Sistem kod göndermeye hazir.');
                console.log('======================================\n');
                isConnected = true;
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.error('WhatsApp baslatilirken hata olustu:', err);
        setTimeout(connectToWhatsApp, 5000);
    }
}

connectToWhatsApp();

app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ success: false, error: 'to ve message alanlari zorunludur.' });
    }
    if (!isConnected || !sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp baglantisi henuz hazir degil. Lutfen QR kodu taratin.' });
    }

    try {
        let formattedNumber = to.replace(/\D/g, '');
        if (formattedNumber.length === 10 && formattedNumber.startsWith('5')) {
            formattedNumber = '90' + formattedNumber;
        } else if (formattedNumber.length === 11 && formattedNumber.startsWith('0')) {
            formattedNumber = '90' + formattedNumber.substring(1);
        }
        const jid = `${formattedNumber}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        console.log(`[WhatsApp Gateway] Kod basariyla gonderildi -> ${formattedNumber}`);
        res.json({ success: true, message: 'Mesaj gonderildi.' });
    } catch (err) {
        console.error('[WhatsApp Gateway Error]', err);
        res.status(500).json({ success: false, error: err.message || 'Mesaj gonderilirken hata olustu.' });
    }
});

app.get('/status', (req, res) => {
    res.json({ success: true, connected: isConnected });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp Gateway http://localhost:${PORT} adresinde calisiyor.`);
});
