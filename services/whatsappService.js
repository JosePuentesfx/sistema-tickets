const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

exports.initialize = () => {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        }
    });

    client.on('qr', (qr) => {
        console.log('\n======================================================');
        console.log('🤖 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP (BOT)');
        console.log('======================================================\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        isReady = true;
        console.log('\n======================================================');
        console.log('✅ WHATSAPP BOT CONECTADO Y LISTO PARA ENVIAR MENSAJES');
        console.log('======================================================\n');
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Autenticado exitosamente.');
    });

    client.on('auth_failure', msg => {
        console.error('Error de Autenticación de WhatsApp:', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp Bot desconectado:', reason);
        isReady = false;
        // Optionally try to restart
        // client.initialize();
    });

    client.initialize();
};

/**
 * Enviar mensaje de WhatsApp
 * @param {string} phone - El número de teléfono (ej. 5215512345678)
 * @param {string} message - El mensaje a enviar
 */
exports.sendMessage = async (phone, message) => {
    if (!isReady || !client) {
        console.warn(`[WhatsApp] Intentó enviar un mensaje a ${phone}, pero el bot no está listo.`);
        return false;
    }

    try {
        // Limpiar el número de teléfono por si tiene +, espacios o guiones
        let cleanPhone = phone.replace(/[\s\-\+]/g, '');
        
        // Verificar si el número existe en WhatsApp y obtener su ID real
        let numberId = await client.getNumberId(cleanPhone);
        
        // Magia para México: Si falla y es un número 52 sin el "1", intentamos agregando el "1"
        if (!numberId && cleanPhone.startsWith('52') && cleanPhone.length === 12) {
            console.log(`[WhatsApp] ${cleanPhone} falló. Intentando con formato 521...`);
            const altPhone = '521' + cleanPhone.substring(2);
            numberId = await client.getNumberId(altPhone);
        }

        if (!numberId) {
            console.error(`[WhatsApp] El número ${phone} no está registrado en WhatsApp o el formato es incorrecto.`);
            return false;
        }
        
        await client.sendMessage(numberId._serialized, message);
        console.log(`[WhatsApp] Mensaje enviado correctamente a ${numberId.user}`);
        return true;
    } catch (error) {
        console.error(`[WhatsApp] Error al enviar mensaje a ${phone}:`, error.message);
        return false;
    }
};
