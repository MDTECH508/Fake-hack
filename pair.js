const { default: makeWASocket, Browsers, initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  let number = (req.query.number || '').replace(/[^0-9]/g, '');
  
  if (!number || number === 'ping') return res.json({ status: 'online' });
  if (number.length < 9) return res.json({ error: 'Nimewo a twò kout. Mete l konsa: 50934946793' });
  if (number.length > 15) return res.json({ error: 'Nimewo a twò long.' });

  // Si nimewo a komanse ak 0, retire l - ex: 034946793 -> 34946793
  // Si li pa gen kòd peyi, ajoute 509 pou Ayiti otomatik
  if (number.startsWith('0')) number = number.slice(1);
  if (number.length === 8) number = '509' + number;

  try {
    // Sèvi ak /tmp sou Vercel - se sèl kote Vercel kite ekri fichye
    const authFolder = '/tmp/blast-auth-' + number;
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
      auth: {
        creds,
        keys: {
          get: () => ({}),
          set: () => {}
        }
      },
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    // TANN SOCKET LA PARE - 8 segond kounye a, pa 3 segond
    console.log('Waiting for socket for ' + number);
    await new Promise(r => setTimeout(r, 8000));

    // Eseye pran code a - eseye 2 fwa si premye a echwe
    let code = null;
    let lastError = null;
    for (let i = 0; i < 2; i++) {
      try {
        code = await sock.requestPairingCode(number);
        if (code) break;
      } catch (e) {
        lastError = e;
        console.log('Attempt ' + (i+1) + ' failed:', e.message);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setTimeout(() => { try { sock.end(); } catch(e){} }, 30000);

    if (code) {
      return res.json({ code, session: true });
    } else {
      return res.json({ error: 'Pa ka jwenn code. Eseye ankò nan 10 segond. Rezon: ' + (lastError?.message || 'Socket pa pare') });
    }

  } catch (e) {
    console.log('Pair fatal error:', e);
    // Erè ki pi souvan yo tradui an kreyòl
    if (e.message.includes('Connection Closed')) return res.json({ error: 'Koneksyon fèmen. Tann 10 segond epi eseye ankò.' });
    if (e.message.includes('401')) return res.json({ error: 'Nimewo sa a deja konekte sou yon lòt aparèy. Eseye ak yon lòt nimewo.' });
    if (e.message.includes('Bad Request')) return res.json({ error: 'Nimewo a pa valab. Verifye l: 50934946793' });
    return res.json({ error: 'Eseye ankò nan 10 segond: ' + e.message });
  }
};
