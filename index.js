// ============================================
// BLAST X ENGINE - Multi-Session WhatsApp Bot
// Style: INCONNU Workspace v2.0.0 style
// Railway Ready - Port 8080
// ============================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");

const config = require('./config');
const BOT_NAME = config.botName;
const OWNER_NAME = config.ownerName;
const OWNER_NUMBER = config.owner;
const PREFIX = config.prefix;
const CHANNEL = config.channel;
const CHANNEL_NAME = config.channelName;

// ========== MULTI-SESSION STORAGE ==========
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

// Map: number -> sock
const activeSockets = new Map();
let totalSessionsCreated = 0;

function getStats() {
  let files = [];
  try { files = fs.readdirSync(sessionsDir); } catch(e){}
  return {
    total: totalSessionsCreated + files.length,
    active: activeSockets.size,
    servers: '1/1 servers reporting'
  };
}

// ========== WEB SERVER - PAJ TANKOU SCREENSHOT LA ==========
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  const stats = getStats();
  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${BOT_NAME}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
body{background:#0a0a0f;color:#fff;min-height:100vh;padding:0}
.topbar{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0a0a0f}
.topbar .logo{width:38px;height:38px;border-radius:10px;background:#0f2a6b;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900}
.topbar h1{font-size:17px;font-weight:900;letter-spacing:1px;line-height:1.1}
.topbar h1 span{display:block;font-size:11px;font-weight:400;color:#888;letter-spacing:0}
.container{max-width:520px;margin:0 auto;padding:18px 16px 40px}
.badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:16px 0 22px}
.badge{background:#1a1a22;border:1px solid #2a2a35;padding:8px 16px;border-radius:100px;font-size:13px;color:#ccc}
.badge b{color:#fff}
.card{background:#13131a;border:1px solid #22222e;border-radius:22px;padding:20px;margin-bottom:16px}
.stats{display:flex;gap:12px}
.stat{flex:1;background:#1a1a22;border-radius:18px;padding:18px 16px}
.stat span{font-size:13px;color:#888}
.stat b{font-size:32px;font-weight:900;display:block;margin-top:6px}
.stat.active b{color:#00e676}
.stat small{font-size:11px;color:#666;display:block;margin-top:6px}
h2{font-size:20px;font-weight:800;margin-bottom:6px}
.card p.desc{font-size:13px;color:#999;line-height:1.5;margin-bottom:16px}
.input-wrap{display:flex;align-items:center;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:14px}
.input-wrap span{background:#eee;color:#000;padding:16px 10px;font-size:16px}
.input-wrap input{flex:1;border:none;outline:none;padding:16px 12px;font-size:16px;color:#000}
.btn{background:#3b82f6;color:#fff;border:none;padding:15px 26px;border-radius:10px;font-weight:700;font-size:16px;cursor:pointer}
.btn:disabled{opacity:.6}
.code-box{text-align:center;padding:20px 0 6px}
#code{font-size:38px;font-weight:900;letter-spacing:8px;word-spacing:6px}
.code-actions{display:flex;gap:10px;justify-content:flex-start;margin-top:12px}
.icon-btn{width:38px;height:38px;border-radius:10px;background:#1e1e28;border:1px solid #2a2a35;color:#fff;cursor:pointer;font-size:16px}
.steps{font-size:13px;color:#aaa;line-height:1.9;margin-top:14px}
.steps b{color:#fff}
.footer{text-align:center;font-size:11px;color:#555;margin-top:20px}
#status{font-size:13px;margin-top:10px;min-height:18px;color:#ffb3b3}
.channel{margin-top:16px;padding:14px;border-radius:16px;background:#1a1a22;border:1px solid #2a2a35;font-size:13px;text-align:center}
.channel a{color:#fff;font-weight:700}
</style></head><body>
<div class="topbar"><div class="logo">⚡</div><h1>${BOT_NAME}<span>Workspace - v2.0.0</span></h1></div>
<div class="container">
<div class="badges"><div class="badge">Node.js &nbsp;·&nbsp; Baileys</div><div class="badge">Multi-session</div><div class="badge">by &nbsp;<b>${OWNER_NAME}</b></div></div>
<div class="card"><div class="stats">
<div class="stat"><span>Total sessions (all servers)</span><b id="totalSess">${stats.total}</b><small>${stats.servers}</small></div>
<div class="stat active"><span>Active sessions</span><b id="activeSess">${stats.active}</b></div>
</div></div>
<div class="card">
<h2>Link a WhatsApp number</h2>
<p class="desc">Enter a number with its country code, digits only — the bot backend generates the pairing code, no app link needed.</p>
<div class="input-wrap"><span>+</span><input id="num" type="tel" placeholder="50934946793" value="50934946793" /></div>
<button class="btn" id="btn" onclick="getCode()">Get pairing code</button>
<p id="status"></p>
<div class="code-box" id="codeBox" style="display:none"><div id="code">--------</div>
<div class="code-actions"><button class="icon-btn" onclick="getCode()">↻</button><button class="icon-btn" onclick="copyCode()">📋</button></div>
</div>
<div class="steps"><b>1.</b> Open WhatsApp on your phone<br><b>2.</b> Go to Settings → Linked Devices → Link a device<br><b>3.</b> Tap "Link with phone number instead" and enter this code</div>
</div>
<div class="channel"><b>JOIN OUR CHANNEL - ${CHANNEL_NAME}</b><br><a href="${CHANNEL}">${CHANNEL_NAME}</a></div>
<p class="footer">© 2026 ${OWNER_NAME} - BLAST X ENGINE</p>
</div>
<script>
async function refreshStats(){ try{ let r=await fetch('/stats'); let d=await r.json(); document.getElementById('totalSess').innerText=d.total; document.getElementById('activeSess').innerText=d.active; }catch(e){} }
refreshStats(); setInterval(refreshStats,5000);
async function getCode(){
  let num=document.getElementById('num').value.replace(/[^0-9]/g,'');
  let status=document.getElementById('status'); let btn=document.getElementById('btn');
  if(num.length<10){ status.innerText='Enter number like: 50934946793'; return; }
  btn.disabled=true; btn.innerText='Generating...'; status.style.color='#fff'; status.innerText='Generating code... wait 10 seconds';
  try{
    let r=await fetch('/pair?number='+num); let d=await r.json();
    if(d.code){ document.getElementById('codeBox').style.display='block'; document.getElementById('code').innerText=d.code; status.style.color='#7dffb0'; status.innerText='Code ready! Enter it in WhatsApp.'; refreshStats(); }
    else { status.style.color='#ffb3b3'; status.innerText=d.error||'Failed.'; }
  }catch(e){ status.innerText='Error. Try again.'; }
  btn.disabled=false; btn.innerText='Get pairing code';
}
function copyCode(){ let c=document.getElementById('code').innerText; navigator.clipboard.writeText(c.replace(/ /g,'')); alert('Code copied: '+c); }
</script></body></html>`);
});

app.get('/stats', (req, res) => { res.json(getStats()); });
app.get('/ping', (req, res) => { res.json({ status: 'online', ...getStats() }); });

app.get('/pair', async (req, res) => {
  let number = (req.query.number || '').replace(/[^0-9]/g, '');
  if (!number) return res.json({ error: 'Enter number' });
  if (number.startsWith('0')) number = number.slice(1);
  if (number.length === 8) number = '509' + number;
  try {
    let sock = activeSockets.get(number);
    if (!sock) {
      console.log(chalk.yellow(`Creating new session for ${number}...`));
      sock = await createSession(number);
      totalSessionsCreated++;
    }
    // Tann socket la pare
    let tries = 0;
    while (!sock && tries < 5) { await delay(2000); sock = activeSockets.get(number); tries++; }
    if (!sock) return res.json({ error: 'Bot is starting, wait 10 seconds and try again.' });
    let code = await sock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join("  -  ") || code;
    // Fòma tankou foto a: SFTE - 2VP W
    code = code.replace(/  -  /g, ' - ');
    console.log(chalk.bgGreen(' PAIRING CODE: ') + ' ' + code + ' for ' + number);
    res.json({ code });
  } catch (e) {
    console.log('Pair error:', e.message);
    res.json({ error: 'Wait 10 seconds and try again. ' + e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(chalk.green(`🚀 BLAST Web on port ${PORT}`)));

// ========== MULTI-SESSION BOT LOGIC ==========
const msgRetryCounterCache = new NodeCache();

async function createSession(phoneNumber) {
  const sessionPath = path.join(sessionsDir, phoneNumber);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: "" }),
    msgRetryCounterCache,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
  });

  activeSockets.set(phoneNumber, sock);
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      if (mek.key.remoteJid === 'status@broadcast') return;
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
      const from = mek.key.remoteJid;
      const body = mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption || mek.message.videoMessage?.caption || "";
      if (!body || !body.startsWith(PREFIX)) return;
      const args = body.slice(PREFIX.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();
      console.log(chalk.cyan(`[${phoneNumber}] [CMD] ${command} from ${from}`));
      await handleCommand(sock, from, command, args);
    } catch (e) { console.error('Message error:', e.message); }
  });

  sock.ev.on('connection.update', async (s) => {
    const { connection, lastDisconnect } = s;
    if (connection === 'open') {
      console.log(chalk.green(`🤖 CONNECTED ✅ ${phoneNumber} - ${sock.user.id}`));
      try {
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        await sock.sendMessage(botNumber, { text: `🤖 Bot Connected Successfully!\n⏰ ${new Date().toLocaleString()}\n✅ Online 24/7\n\nType ${PREFIX}menu to start` });
      } catch (e) {}
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errMsg = String(lastDisconnect?.error?.message || '');
      const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
      const isConflict = statusCode === DisconnectReason.connectionReplaced || statusCode === 440 || /conflict|replaced/i.test(errMsg);
      if (isLoggedOut) {
        console.log(chalk.red(`Logged out ${phoneNumber} - clearing session`));
        activeSockets.delete(phoneNumber);
        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
        return;
      }
      if (isConflict) { console.log(chalk.yellow(`Conflict ${phoneNumber} - keeping session`)); return; }
      console.log(chalk.yellow(`🔄 Reconnecting ${phoneNumber} in 5s...`));
      activeSockets.delete(phoneNumber);
      await delay(5000);
      // Pa rekree otomatikman si li pa t janm konekte - tann nouvo pairing
      // Si li te deja konekte, rekree l
      if (state.creds.registered) { await createSession(phoneNumber); }
    }
  });

  return sock;
}

// ========== COMMANDS ==========
async function handleCommand(sock, from, command, args) {
  const uptimeSec = process.uptime();
  const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${Math.floor(uptimeSec % 60)}s`;
  const stats = getStats();

  if (command === 'menu' || command === 'help' || command === 'h') {
    await sock.sendMessage(from, { text: `╭━━━〔 *${BOT_NAME}* 〕━━━┈⊷\n┃ Owner: ${OWNER_NAME}\n┃ Prefix: ${PREFIX}\n┃ Mode: Public ✅\n┃ Active Sessions: ${stats.active}\n┃ Status: Online 24/7 🟢\n╰━━━━━━━━━━━━━━━┈⊷\n\n╭━━━〔 *📋 MAIN* 〕━━━┈⊷\n┃ ${PREFIX}menu - Show menu\n┃ ${PREFIX}info - Bot info\n┃ ${PREFIX}ping - Speed\n┃ ${PREFIX}owner - Owner\n┃ ${PREFIX}support - Support\n╰━━━━━━━━━━━━━━━┈⊷\n\n╭━━━〔 *🛒 SERVICES* 〕━━━┈⊷\n┃ ${PREFIX}price - Price list\n┃ ${PREFIX}order - Order\n┃ ${PREFIX}website - Order website\n┃ ${PREFIX}bot - Order WhatsApp Bot\n╰━━━━━━━━━━━━━━━┈⊷\n\n╭━━━〔 *👥 GROUP* 〕━━━┈⊷\n┃ ${PREFIX}tagall - Tag everyone\n╰━━━━━━━━━━━━━━━┈⊷\n\n*📢 Channel:* ${CHANNEL_NAME}\n${CHANNEL}\n\n*👑 Owner:* https://wa.me/${OWNER_NUMBER}` });
    return;
  }
  if (command === 'info' || command === 'about') {
    await sock.sendMessage(from, { text: `╭━━━〔 *${BOT_NAME} - INFO* 〕━━━┈⊷\n┃ Bot: ${BOT_NAME}\n┃ Owner: ${OWNER_NAME}\n┃ Number: +${OWNER_NUMBER}\n┃ Prefix: ${PREFIX}\n┃ Total Sessions: ${stats.total}\n┃ Active: ${stats.active}\n┃ Uptime: ${uptime}\n┃ RAM: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n┃ Status: Online 24/7 🟢\n╰━━━━━━━━━━━━━━━┈⊷\n\n*📢 Channel:* ${CHANNEL}\n*👑 Owner:* https://wa.me/${OWNER_NUMBER}\n\n_Type ${PREFIX}menu_` });
    return;
  }
  if (command === 'ping' || command === 'speed') {
    const start = Date.now();
    await sock.sendMessage(from, { text: '🏓 Pinging...' });
    await sock.sendMessage(from, { text: `🏓 *PONG!*\n⚡ Speed: ${Date.now() - start}ms\n⏰ Uptime: ${uptime}\n👥 Active: ${stats.active}\n✅ Status: Online` });
    return;
  }
  if (command === 'owner') { await sock.sendMessage(from, { text: `👑 *OWNER*\n\nName: ${OWNER_NAME}\nNumber: +${OWNER_NUMBER}\n\nhttps://wa.me/${OWNER_NUMBER}` }); return; }
  if (command === 'price') { await sock.sendMessage(from, { text: `💰 *PRICE LIST*\n\n🌐 Website: Contact us\n🤖 WhatsApp Bot: Contact us\n🎨 Design: Contact us\n\n👑 https://wa.me/${OWNER_NUMBER}` }); return; }
  if (command === 'order') { await sock.sendMessage(from, { text: `🛒 *ORDER*\n\nSend what you want, we confirm price.\n\n👑 https://wa.me/${OWNER_NUMBER}` }); return; }
  if (command === 'website') { await sock.sendMessage(from, { text: `🌐 *ORDER WEBSITE*\n\n👑 https://wa.me/${OWNER_NUMBER}?text=Hello, I want a website` }); return; }
  if (command === 'bot') { await sock.sendMessage(from, { text: `🤖 *ORDER BOT*\n\n👑 https://wa.me/${OWNER_NUMBER}?text=Hello, I want a WhatsApp Bot` }); return; }
  if (command === 'support') { await sock.sendMessage(from, { text: `🆘 *SUPPORT*\n\nhttps://wa.me/${OWNER_NUMBER}\n${CHANNEL}` }); return; }
  if (command === 'tagall' && from.endsWith('@g.us')) {
    try {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map(p => p.id);
      await sock.sendMessage(from, { text: `📢 *TAG ALL*\n\n${participants.map(p => '@' + p.split('@')[0]).join('\n')}\n\nTotal: ${participants.length}`, mentions: participants });
    } catch(e){ await sock.sendMessage(from, { text: '❌ Make bot admin first.' }); }
    return;
  }
}

// Restore ansyen sessions yo lè bot la demare
(async () => {
  try {
    const dirs = fs.readdirSync(sessionsDir);
    for (let d of dirs) {
      if (/^\d+$/.test(d)) { console.log('Restoring session:', d); await createSession(d); await delay(1000); }
    }
  } catch(e){}
})();

setInterval(() => { console.log('💓 BLAST alive - Active:', activeSockets.size, '-', new Date().toISOString()); }, 30000);
process.on('uncaughtException', (e) => console.error('Uncaught:', e.message));
process.on('unhandledRejection', (e) => console.error('Rejection:', e.message));
