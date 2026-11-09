// ============================================
// BLAST BOT - KÒD OU A + WEB PAIRING + AUTO-RESTART
// KENBE TOUT LOJIK OU A
// ============================================
const fs = require('fs');
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, jidDecode, delay } = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const chalk = require("chalk");
const { parsePhoneNumber } = require("libphonenumber-js");
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics');
const { rmSync, existsSync } = require('fs');
const { join } = require('path');

// --- IMPORT OU YO - PA TOUCHE ---
const store = require('./lib/lightweight_store');
store.readFromFile();
const settings = require('./settings');
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

// --- WEB SERVER POU PAIRING - NOUVO ---
const app = express();
app.use(express.json());
let currentSock = null;
let currentPairingCode = null;

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
</style></head><body>
  <div class="card">
    <div class="logo"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></div>
    <h1>BLAST X ENGINE</h1>
    <p class="owner">BY BLAST TECHNOLOGY</p>
    <div class="ping-box">
      <div class="ping-item"><b><span class="dot"></span> ONLINE</b><span>STATUS</span></div>
      <div class="ping-item"><b id="ping">-- ms</b><span>PING</span></div>
      <div class="ping-item"><b>24/7</b><span>UPTIME</span></div>
    </div>
    <label>ENTER YOUR WHATSAPP NUMBER</label>
    <div class="input-wrap"><span>+</span><input id="num" type="tel" placeholder="509 3494 6793" /></div>
    <button class="btn" id="btn" onclick="getCode()">GET PAIRING CODE</button>
    <p id="status"></p>
    <div class="code-box" id="codeBox"><span style="font-size:11px;letter-spacing:2px;color:#aaa">YOUR PAIRING KEY - METE L NAN WHATSAPP</span><div id="code">--------</div><button class="copy-btn" onclick="copyCode()">Copy Key</button><p style="font-size:12px;color:#ffcc00;margin-top:10px">⏳ Apre ou mete KEY a, bot la ap konekte pou kont li.</p></div>
    <div class="steps"><b>HOW TO CONNECT:</b><br>1. Mete nimewo ou → GET PAIRING CODE<br>2. Kopye KEY a<br>3. WhatsApp > Settings > Linked Devices<br>4. Link with phone number → Kole KEY a<br>5. Bot la konekte pou kont li!</div>
    <div class="channel"><b>JOIN OUR CHANNEL - BLAST TEAM !</b><br><a href="https://whatsapp.com/channel/0029Vb6tw1G42Dcja42wiY3R">BLAST TEAM !</a></div>
    <p class="footer">© 2026 BLAST TECHNOLOGY • ALL RIGHTS RESERVED</p>
  </div>
<script>
  async function checkPing(){
    let start = Date.now();
    try{ await fetch('/ping'); document.getElementById('ping').innerText = (Date.now()-start)+' ms'; }
    catch(e){ document.getElementById('ping').innerText='ONLINE'; }
  }
  checkPing(); setInterval(checkPing, 10000);
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
  res.json({ status: 'online', connected: currentSock ? true : false, uptime: process.uptime() });
});

app.get('/pair', async (req, res) => {
  let number = (req.query.number || '').replace(/[^0-9]/g, '');
  if (!number) return res.json({ error: 'Mete nimewo' });
  if (number.startsWith('0')) number = number.slice(1);
  if (number.length === 8) number = '509' + number;
  try {
    if (!currentSock) return res.json({ error: 'Bot la ap demare, tann 10 segond epi eseye ankò.' });
    let code = await currentSock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    currentPairingCode = code;
    console.log(chalk.bgGreen(' PAIRING KEY: ') + ' ' + code + ' pou ' + number);
    res.json({ code });
  } catch (e) {
    console.log('Pair web error:', e.message);
    res.json({ error: 'Tann 10 segond epi eseye ankò. ' + e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(chalk.green(`🚀 BLAST Web sou port ${PORT} - Louvri link la pou pran KEY`)));

// --- KEEP ALIVE POU RAILWAY PA FÈ L DÒMI ---
setInterval(() => {
  console.log('💓 BLAST alive - ' + new Date().toISOString() + ' - Connected: ' + (currentSock ? 'YES' : 'NO'));
}, 30000);

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000)

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1)
    }
}, 30_000)

let phoneNumber = "50934946793"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "BLAST BOT"
global.themeemoji = "•"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

async function startXeonBotInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        currentSock = XeonBotInc; // <-- POU WEB LA KA JENN LI

        XeonBotInc.ev.on('creds.update', saveCreds)
        store.bind(XeonBotInc.ev)

        // --- TOUT MESAJ OU YO - PA TOUCHE ---
        XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(XeonBotInc, chatUpdate);
                    return;
                }
                if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                    if (!isGroup) return
                }
                if (mek.key?.remoteJid?.endsWith('@g.us') && !mek.key.fromMe) {
                    try { await handleAntibotDetection(XeonBotInc, mek) } catch (abErr) { console.error('[antibot] upsert hook:', abErr?.message || abErr) }
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
                if (XeonBotInc?.msgRetryCounterCache) { XeonBotInc.msgRetryCounterCache.clear() }
                try { await handleMessages(XeonBotInc, chatUpdate, true) } catch (err) {
                    console.error("Error in handleMessages:", err)
                    if (mek.key && mek.key.remoteJid) {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: '❌ An error occurred while processing your message.',
                            contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363161513685998@newsletter', newsletterName: 'KnightBot MD', serverMessageId: -1 } }
                        }).catch(console.error);
                    }
                }
            } catch (err) { console.error("Error in messages.upsert:", err) }
        })

        XeonBotInc.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        XeonBotInc.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = XeonBotInc.decodeJid(contact.id)
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })

        XeonBotInc.getName = (jid, withoutContact = false) => {
            id = XeonBotInc.decodeJid(jid)
            withoutContact = XeonBotInc.withoutContact || withoutContact
            let v
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            else v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ? XeonBotInc.user : (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        XeonBotInc.public = true
        XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

        // Pairing code - KENBE L POU TERMINAL LA TOU
        if (pairingCode && !XeonBotInc.authState.creds.registered) {
            if (useMobile) throw new Error('Cannot use pairing code with mobile api')
            let pnNumber = global.phoneNumber || phoneNumber
            pnNumber = pnNumber.replace(/[^0-9]/g, '')
            const pn = require('awesome-phonenumber');
            if (!pn('+' + pnNumber).isValid()) {
                console.log(chalk.red('Invalid phone number.'));
                process.exit(1);
            }
            setTimeout(async () => {
                try {
                    let code = await XeonBotInc.requestPairingCode(pnNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                    console.log(chalk.yellow(`\nOu ka pran KEY a sou link web la tou.`))
                } catch (error) {
                    console.error('Error requesting pairing code:', error)
                }
            }, 3000)
        }

        // Connection handling - AVÈK AUTO-RESTART
        XeonBotInc.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s
            if (qr) console.log(chalk.yellow('📱 QR Code generated.'))
            if (connection === 'connecting') console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
            if (connection == "open") {
                console.log(chalk.magenta(` `))
                console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))
                try {
                    const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                    await XeonBotInc.sendMessage(botNumber, {
                        text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n✅Make sure to join below channel`,
                        contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363161513685998@newsletter', newsletterName: 'KnightBot MD', serverMessageId: -1 } }
                    });
                } catch (error) { console.error('Error sending connection message:', error.message) }
                await delay(1999)
                console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'KNIGHT BOT'} ]`)}\n\n`))
                console.log(chalk.cyan(`< ================================================== >`))
                console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: ENGINE`))
                console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
                console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
                console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: MR UNIQUE HACKER`))
                console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
                console.log(chalk.blue(`Bot Version: ${settings.version}`))
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode
                const errMsg = String(lastDisconnect?.error?.message || lastDisconnect?.error || '')
                const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401
                const isConflict = statusCode === DisconnectReason.connectionReplaced || statusCode === 440 || /conflict|replaced/i.test(errMsg)
                const shouldReconnect = !isLoggedOut && !isConflict
                console.log(chalk.red(`Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`))
                currentSock = null;
                if (isConflict) {
                    console.log(chalk.yellow('⚠️ Session conflict: another device/instance connected.'))
                    console.log(chalk.yellow('   Stop other `node .` / WhatsApp Web linked sessions, then start the bot once.'))
                    return
                }
                if (isLoggedOut) {
                    try { rmSync('./session', { recursive: true, force: true }); console.log(chalk.yellow('Session folder deleted. Please re-authenticate.')) } catch (error) { console.error('Error deleting session:', error) }
                    console.log(chalk.red('Session logged out. Please re-authenticate.'))
                    return
                }
                if (shouldReconnect) {
                    console.log(chalk.yellow('🔄 RESTART OTOMATIK nan 5 segond...'))
                    await delay(5000)
                    startXeonBotInc()
                }
            }
        })

        const antiCallNotified = new Set();
        XeonBotInc.ev.on('call', async (calls) => {
            try {
                const { readState: readAnticallState } = require('./commands/anticall');
                const state = readAnticallState();
                if (!state.enabled) return;
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId;
                    if (!callerJid) continue;
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) { await XeonBotInc.rejectCall(call.id, callerJid); }
                        else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) { await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject'); }
                    } catch {}
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                    setTimeout(async () => { try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {} }, 800);
                }
            } catch (e) {}
        });

        XeonBotInc.ev.on('group-participants.update', async (update) => { await handleGroupParticipantUpdate(XeonBotInc, update); });
        XeonBotInc.ev.on('messages.upsert', async (m) => { if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') { await handleStatus(XeonBotInc, m); } });
        XeonBotInc.ev.on('status.update', async (status) => { await handleStatus(XeonBotInc, status); });
        XeonBotInc.ev.on('messages.reaction', async (status) => { await handleStatus(XeonBotInc, status); });

        return XeonBotInc
    } catch (error) {
        console.error('Error in startXeonBotInc:', error)
        await delay(5000)
        startXeonBotInc()
    }
}

startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err) })
process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err) })

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
