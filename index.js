// ============================================
// BLAST X ENGINE - BOT + PAIRING + AUTO-RESTART
// BY BLAST TECHNOLOGY
// ============================================
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');

const app = express();
app.use(express.json());

let sock = null;
let isStarting = false;
let restartCount = 0;
let lastPairingCode = null;
let lastNumber = null;

function withChannel(text) {
  return `${text}\n\n*📢 JOIN CHANNEL:*\n*${config.channelName}*\n${config.channel}\n_${config.footer}_`;
}

// ========== PAJ PAIRING LA ==========
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>BLAST X ENGINE - Get Pairing Code</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
  body{background:#050507;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{width:100%;max-width:440px;padding:32px 28px;border-radius:34px;background:linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.04) 45%, rgba(255,255,255,.09));backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.25);box-shadow:0 30px 70px rgba(0,0,0,.6);text-align:center}
  .logo{width:64px;height:64px;margin:0 auto 14px;border-radius:20px;background:linear-gradient(145deg, rgba(255,255,255,.3), rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center}
  h1{font-size:26px;font-weight:900}
  .owner{color:#b8b8c2;font-size:13px;letter-spacing:2px;margin-top:4px}
  .ping-box{display:flex;justify-content:space-between;gap:10px;margin:20px 0}
  .ping-item{flex:1;padding:12px 8px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}
  .ping-item b{font-size:15px;display:block}
  .ping-item span{font-size:11px;color:#aaa;letter-spacing:1px}
  .dot{width:10px;height:10px;background:#00ff88;border-radius:50%;display:inline-block;box-shadow:0 0 12px #00ff88}
  label{display:block;text-align:left;font-size:13px;color:#c8c8d0;margin:14px 0 8px}
  .input-wrap{position:relative}
  .input-wrap span{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#888}
  input{width:100%;padding:16px 16px 16px 48px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.35);color:#fff;font-size:17px;outline:none}
  .btn{width:100%;margin-top:18px;padding:17px;border-radius:100px;background:#fff;color:#000;font-weight:900;font-size:16px;border:none;cursor:pointer}
  .code-box{margin-top:22px;padding:20px;border-radius:20px;background:rgba(0,0,0,.4);border:1px dashed rgba(255,255,255,.35);display:none}
  .code-box.show{display:block}
  #code{font-size:36px;font-weight:900;letter-spacing:10px;margin:8px 0}
  .copy-btn{padding:10px 20px;border-radius:100px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff;cursor:pointer;font-weight:700;margin-top:8px}
  .steps{text-align:left;margin-top:20px;padding:16px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:13px;line-height:1.8;color:#b8b8c2}
  .channel{margin-top:18px;padding:14px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);font-size:13px}
  .channel a{color:#fff;font-weight:700;word-break:break-all}
  .footer{margin-top:16px;font-size:11px;color:#777}
  #status{font-size:13px;margin-top:10px;color:#ffb3b3;min-height:18px}
  #botStatus{font-size:12px;color:#7dffb0;margin-top:6px}
</style></head><body>
  <div class="card">
    <div class="logo"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></div>
    <h1>BLAST X ENGINE</h1>
    <p class="owner">BY BLAST TECHNOLOGY</p>
    <p id="botStatus">Bot Status: Checking...</p>
    <div class="ping-box">
      <div class="ping-item"><b><span class="dot"></span> ONLINE</b><span>STATUS</span></div>
      <div class="ping-item"><b id="ping">-- ms</b><span>PING</span></div>
      <div class="ping-item"><b>24/7</b><span>UPTIME</span></div>
    </div>
    <label>ENTER YOUR WHATSAPP NUMBER</label>
    <div class="input-wrap"><span>+</span><input id="num" type="tel" placeholder="509 3494 6793" /></div>
    <button class="btn" id="btn" onclick="getCode()">GET PAIRING CODE</button>
    <p id="status"></p>
    <div class="code-box" id="codeBox"><span style="font-size:11px;letter-spacing:2px;color:#aaa">YOUR PAIRING KEY - METE L NAN WHATSAPP</span><div id="code">--------</div><button class="copy-btn" onclick="copyCode()">Copy Key</button><p style="font-size:12px;color:#ffcc00;margin-top:10px">⏳ Apre ou mete KEY a, bot la ap konekte pou kont li. Pa fèmen paj la.</p></div>
    <div class="steps"><b>HOW TO CONNECT:</b><br>1. Mete nimewo ou → GET PAIRING CODE<br>2. Kopye KEY a<br>3. WhatsApp > Settings > Linked Devices<br>4. Link with phone number → Kole KEY a<br>5. Bot la konekte pou kont li + .menu ap mache!</div>
    <div class="channel"><b>JOIN OUR CHANNEL - BLAST TEAM !</b><br><a href="${config.channel}">${config.channel}</a></div>
    <p class="footer">© 2026 BLAST TECHNOLOGY • ALL RIGHTS RESERVED</p>
  </div>
<script>
  async function checkPing(){
    let start = Date.now();
    try{
      let r = await fetch('/ping'); let d = await r.json();
      document.getElementById('ping').innerText = (Date.now()-start)+' ms';
      document.getElementById('botStatus').innerText = 'Bot Status: ' + (d.connected ? '✅ CONNECTED - .menu ap mache' : '⏳ AP TANN KONEKSYON - Mete KEY a');
      document.getElementById('botStatus').style.color = d.connected ? '#7dffb0' : '#ffcc00';
    }catch(e){ document.getElementById('ping').innerText='ONLINE'; }
  }
  checkPing(); setInterval(checkPing, 5000);
  async function getCode(){
    let num = document.getElementById('num').value.replace(/[^0-9]/g,'');
    let status = document.getElementById('status'); let btn = document.getElementById('btn');
    if(num.length < 10){ status.innerText='Mete nimewo a konsa: 50934946793'; return; }
    btn.disabled=true; btn.innerText='GENERATING KEY...'; status.style.color='#fff'; status.innerText='Ap jenere KEY ou... tann 10 segond';
    try{
      let r = await fetch('/pair?number='+num); let d = await r.json();
      if(d.code){ document.getElementById('codeBox').classList.add('show'); document.getElementById('code').innerText=d.code; status.style.color='#7dffb0'; status.innerText='KEY ou pare! Mete l nan WhatsApp kounye a.'; }
      else{ status.style.color='#ffb3b3'; status.innerText=d.error||'Echwe. Eseye ankò.'; }
    }catch(e){ status.innerText='Erè. Eseye ankò.'; }
    btn.disabled=false; btn.innerText='GET PAIRING CODE';
  }
  function copyCode(){ let c=document.getElementById('code').innerText; navigator.clipboard.writeText(c); alert('KEY kopye: '+c); }
</script></body></html>
  `);
});

app.get('/ping', (req, res) => {
  res.json({ status: 'online', connected: sock ? true : false, bot: config.botName, restarts: restartCount, uptime: process.uptime() });
});

app.get('/pair', async (req, res) => {
  let number = (req.query.number || '').replace(/[^0-9]/g, '');
  if (!number) return res.json({ error: 'Mete nimewo' });
  if (number.startsWith('0')) number = number.slice(1);
  if (number.length === 8) number = '509' + number;
  lastNumber = number;

  try {
    if (!sock) {
      await startBot();
      await new Promise(r => setTimeout(r, 4000));
    }
    if (!sock) return res.json({ error: 'Bot la ap demare, tann 10 segond epi eseye ankò.' });
    const code = await sock.requestPairingCode(number);
    lastPairingCode = code;
    console.log('🔑 KEY jenere pou ' + number + ': ' + code);
    res.json({ code });
  } catch (e) {
    console.log('Pair error:', e.message);
    res.json({ error: 'Tann 10 segond epi eseye ankò. ' + e.message });
  }
});

// ========== BOT LA AK AUTO-RESTART ==========
async function startBot() {
  if (isStarting) return;
  isStarting = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_blast');
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      markOnlineOnConnect: true,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('❌ Bot dekonekte. Kòd: ' + statusCode + ' | Restart? ' + shouldReconnect);
        sock = null;
        isStarting = false;
        if (shouldReconnect) {
          restartCount++;
          console.log('🔄 RESTART BOT OTOMATIK... #' + restartCount);
          setTimeout(startBot, 3000); // Restart nan 3 segond
        } else {
          console.log('⚠️ Ou fè logout. Efase auth_blast pou rekonekte.');
        }
      } else if (connection === 'open') {
        console.log('✅ BLAST BOT KONEKTE - ' + config.ownerName + ' - Restart: ' + restartCount);
        restartCount = 0;
        isStarting = false;
      }
    });

    // ========== MESAJ AK MENU ==========
    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';

        if (!text.startsWith(config.prefix)) {
          if (['hi','hello','bonjour','salut','yo','hello bot'].includes(text.toLowerCase().trim())) {
            await sock.sendMessage(from, { text: withChannel(`Hello! 👋 Welcome to *${config.botName}* by *${config.ownerName}*\n\nTape *${config.prefix}menu* pou wè tout sèvis yo.`) });
          }
          return;
        }

        const cmd = text.slice(1).trim().split(' ')[0].toLowerCase();
        console.log('📩 Kòmand: ' + cmd + ' soti ' + from);

        if (cmd === 'menu' || cmd === 'help') {
          await sock.sendMessage(from, { text: withChannel(
            `*🤖 ${config.botName} - MENU*\n*By ${config.ownerName}*\n\n` +
            `*📋 SÈVIS NOU YO:*\n` +
            `• *${config.prefix}menu* - Montre meni sa a\n` +
            `• *${config.prefix}info* - Enfò sou bot la\n` +
            `• *${config.prefix}ping* - Tcheke vitès bot la\n` +
            `• *${config.prefix}owner* - Kontakte pwopriyetè a\n` +
            `• *${config.prefix}price* - Lis pri nou yo\n` +
            `• *${config.prefix}order* - Fè kòmand\n` +
            `• *${config.prefix}website* - Kòmande website\n` +
            `• *${config.prefix}bot* - Kòmande WhatsApp Bot\n` +
            `• *${config.prefix}support* - Sipò\n\n` +
            `*Tape youn nan kòmand yo pou kontinye.*`
          )});
        }
        else if (cmd === 'info') {
          await sock.sendMessage(from, { text: withChannel(`*ℹ️ ${config.botName}*\n\n*Owner:* ${config.ownerName}\n*Version:* 1.0.0\n*Status:* Online 24/7 ✅\n*Restarts:* ${restartCount}\n\nBot sa a fèt pa *BLAST TECHNOLOGY*`) });
        }
        else if (cmd === 'ping') {
          await sock.sendMessage(from, { text: withChannel(`🏓 *Pong!* Bot la rapid - 0.02s\n✅ Online 24/7`) });
        }
        else if (cmd === 'owner') {
          await sock.sendMessage(from, { text: withChannel(`*👑 Owner:* ${config.ownerName}\n*Nimewo:* +${config.owner}\n*WhatsApp:* https://wa.me/${config.owner}`) });
        }
        else if (cmd === 'price') {
          await sock.sendMessage(from, { text: withChannel(`*💰 BLAST TECHNOLOGY - PRICE LIST*\n\n• Website Landing Page - Kontakte nou\n• Full Website - Kontakte nou\n• WhatsApp Bot - Kontakte nou\n• Website Security - Kontakte nou\n• Video / Photo Editing - Kontakte nou\n\nKòmande kounye a: https://wa.me/${config.owner}`) });
        }
        else if (cmd === 'order' || cmd === 'website' || cmd === 'bot') {
          await sock.sendMessage(from, { text: withChannel(`Ou vle kòmande? Super! 🎉\n\nVoye nou:\n1. Non ou\n2. Kisa ou bezwen (Website / Bot / Editing)\n3. Bidjè ou\n\nN ap reponn vit: https://wa.me/${config.owner}`) });
        }
        else if (cmd === 'support') {
          await sock.sendMessage(from, { text: withChannel(`*🛟 Support - ${config.ownerName}*\nNou la pou ou. Ekri nou: https://wa.me/${config.owner}`) });
        }
      } catch (e) { console.log('Message error:', e.message); }
    });

    isStarting = false;
  } catch (e) {
    console.log('❌ StartBot echwe, ap restart nan 5 segond:', e.message);
    sock = null;
    isStarting = false;
    restartCount++;
    setTimeout(startBot, 5000);
  }
}

// ========== SI BOT LA KRAZE, LI PA MOUNRI - LI RESTART ==========
process.on('uncaughtException', (err) => {
  console.log('⚠️ Uncaught Exception, ap restart bot la:', err.message);
  sock = null;
  isStarting = false;
  setTimeout(startBot, 3000);
});

process.on('unhandledRejection', (reason) => {
  console.log('⚠️ Unhandled Rejection, ap kontinye:', reason);
});

// ========== KEEP ALIVE - PING TÈT LI CHAK 30 SEGOND POU PA DÒMI ==========
setInterval(() => {
  console.log('💓 BLAST BOT alive - ' + new Date().toISOString() + ' - Connected: ' + (sock ? 'YES' : 'NO') + ' - Restarts: ' + restartCount);
  // Si bot la pa konekte, restart li
  if (!sock && !isStarting) {
    console.log('🔄 Bot la pa konekte, ap restart li kounye a...');
    startBot();
  }
}, 30000);

// ========== DEMARE SÈVÈ A ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 BLAST Server sou port ' + PORT);
  startBot();
});
