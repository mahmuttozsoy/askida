import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } from '@whiskeysockets/baileys';
import pino from 'pino';

async function run() {
    console.log('--------------------------------------------------');
    console.log('🚀 WhatsApp Gateway: Arşivden Çıkarma Başlatılıyor...');
    console.log('--------------------------------------------------');

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();
    
    // Create in-memory store to keep track of all synced chats
    const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });

    const sock = makeWASocket({
        auth: state,
        version,
        browser: ['Windows', 'Chrome', '110.0.5481.177'],
        logger: pino({ level: 'silent' })
    });

    // Bind the socket events to the store to populate chats
    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log('\n⚠️ Bağlantı aktif değil. Lütfen aşağıdaki QR kodunu taratın:');
        }

        if (connection === 'open') {
            console.log('\n🎉 WhatsApp Bağlantısı Başarıyla Açıldı!');
            console.log('Sohbet geçmişinin senkronize edilmesi için 5 saniye bekleniyor...');
            
            setTimeout(async () => {
                const allChats = store.chats.all();
                console.log(`\n🔍 Taranan Toplam Sohbet Sayısı: ${allChats.length}`);
                
                let unarchivedCount = 0;
                
                for (const chat of allChats) {
                    if (chat.archive) {
                        const name = chat.name || chat.id;
                        console.log(`📦 Arşivlenmiş sohbet bulundu: "${name}" (${chat.id})`);
                        console.log(`   ↳ Arşivden çıkarılıyor...`);
                        try {
                            await sock.chatModify({ archive: false }, chat.id);
                            unarchivedCount++;
                        } catch (err) {
                            console.error(`   ❌ Hata (${chat.id}):`, err.message);
                        }
                    }
                }
                
                console.log('\n--------------------------------------------------');
                console.log(`✅ İşlem Başarıyla Tamamlandı!`);
                console.log(`📊 Toplam ${unarchivedCount} sohbet arşivden çıkarıldı.`);
                console.log('--------------------------------------------------');
                process.exit(0);
            }, 5000);
        }
        
        if (connection === 'close') {
            const statusCode = update.lastDisconnect?.error?.output?.statusCode;
            console.log(`ℹ️ Bağlantı kapandı (Durum kodu: ${statusCode}).`);
        }
    });
}

run().catch((err) => {
    console.error('Kritik Hata:', err);
    process.exit(1);
});
