const { default: makeWASocket, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

function memoryAuth() {
  let creds = null;
  let keys = {};
  return {
    state: {
      get creds() { return creds; },
      set creds(v) { creds = v; },
      keys: {
        get: (type, ids) => {
          let data = {};
          for (let id of ids) { if (keys[`${type}-${id}`]) data[id] = keys[`${type}-${id}`]; }
          return data;
        },
        set: (data) => {
          for (let type in data) { for (let id in data[type]) { keys[`${type}-${id}`] = data[type][id]; } }
        }
      }
    },
    saveCreds: () => {}
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const number = (req.query.number || '').replace(/[^0-9]/g, '');
  if (!number || number === 'ping') return res.json({ status: 'online' });
  if (number.length < 10) return res.json({ error: 'Invalid number' });
  try {
    const { state } = memoryAuth();
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false
    });
    await new Promise(r => setTimeout(r, 3000));
    const code = await sock.requestPairingCode(number);
    setTimeout(() => { try { sock.end(); } catch(e){} }, 50000);
    return res.json({ code });
  } catch (e) {
    return res.json({ error: 'Try again in 10 seconds. ' + e.message });
  }
};
