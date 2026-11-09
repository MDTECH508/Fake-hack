const { default: makeWASocket, Browsers, initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Kenbe sesyon yo nan memwa Vercel la
global.blastSessions = global.blastSessions || {};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const action = req.query.action || 'pair';
  let number = (req.query.number || '').replace(/[^0-9]/g, '');

  // ---- TCHEKE SI LI KONEKTE ----
  if (action === 'status') {
    const s = global.blastSessions[number];
    if (!s) return res.json({ status: 'waiting' });
    if (s.connected) return res.json({ status: 'connected', sessionId: s.sessionId });
    if (s.error) return res.json({ status: 'error', error: s.error });
    return res.json({ status: 'waiting' });
  }

  // ---- JENERE KEY A ----
  if (!number || number === 'ping') return res.json({ status: 'online' });
  if (number.startsWith('0')) number = number.slice(1);
  if (number.length === 8) number = '509' + number;
  if (number.length < 9) return res.json({ error: 'Mete nimewo a konsa: 50934946793' });

  // Si sesyon an deja egziste, retounen menm code a
  if (global.blastSessions[number] && global.blastSessions[number].code) {
    return res.json({ code: global.blastSessions[number].code });
  }

  try {
    const authFolder = '/tmp/blast-' + number;
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });
    const credsPath = path.join(authFolder, 'creds.json');

    let creds = null;
    if (fs.existsSync(credsPath)) {
      try { creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'), BufferJSON.reviver); } catch(e){ creds = null; }
    }
    if (!creds) creds = initAuthCreds();

    const saveCreds = () => {
      try { fs.writeFileSync(credsPath, JSON.stringify(creds, BufferJSON.replacer, 2)); } catch(e){}
    };

    const sock = makeWASocket({
      auth: { creds, keys: { get: () => ({}), set: () => {} } },
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    // Lè li konekte, sove SESSION ID a
    sock.ev.on('connection.update', (update) => {
      const { connection } = update;
      if (connection === 'open') {
        console.log('✅ CONNECTED: ' + number);
        // Kreye SESSION ID - se KEY pou Railway a
        const sessionId = 'BLAST_' + Buffer.from(JSON.stringify(creds, BufferJSON.replacer)).toString('base64').slice(0, 200);
        global.blastSessions[number] = { ...global.blastSessions[number], connected: true, sessionId: sessionId, fullCreds: creds };
        saveCreds();
      }
      if (connection === 'close') {
        if (global.blastSessions[number] && !global.blastSessions[number].connected) {
          global.blastSessions[number].error = 'Koneksyon fèmen. Eseye ankò.';
        }
      }
    });

    global.blastSessions[number] = { sock, code: null, connected: false };

    await new Promise(r => setTimeout(r, 8000));

    let code = null;
    for (let i = 0; i < 2; i++) {
      try { code = await sock.requestPairingCode(number); if (code) break; }
      catch (e) { await new Promise(r => setTimeout(r, 3000)); }
    }

    if (!code) return res.json({ error: 'Pa ka jwenn KEY. Tann 10 segond epi eseye ankò.' });

    global.blastSessions[number].code = code;

    // Kite socket la rete louvri 2 minit pou l ka konekte
    setTimeout(() => { try { sock.end(); } catch(e){} }, 120000);

    return res.json({ code });

  } catch (e) {
    return res.json({ error: 'Eseye ankò: ' + e.message });
  }
};
