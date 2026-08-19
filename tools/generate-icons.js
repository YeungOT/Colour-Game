/* Generates the PWA PNG icons from icon.svg / icon-maskable.svg using
   headless Chrome CDP so every output is exactly the requested square size. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.CDP_PORT || 9333);
const profileDir = path.join(os.tmpdir(), 'colour-game-icons-' + Date.now());

const jobs = [
  { size: 192, source: 'icon.svg', output: 'icon-192.png' },
  { size: 512, source: 'icon.svg', output: 'icon-512.png' },
  { size: 1024, source: 'icon.svg', output: 'icon-1024.png' },
  { size: 180, source: 'icon.svg', output: 'apple-touch-icon.png' },
  { size: 512, source: 'icon-maskable.svg', output: 'icon-maskable-512.png' },
  { size: 1024, source: 'icon-maskable.svg', output: 'icon-maskable-1024.png' }
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTargets() {
  const response = await fetch('http://127.0.0.1:' + port + '/json/list');
  return response.json();
}

async function waitForTarget(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const targets = await getTargets();
      const page = targets.find((target) => target.type === 'page');
      if (page) return page;
    } catch (error) {}
    await delay(200);
  }
  throw new Error('Chrome DevTools target did not appear');
}

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profileDir,
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const page = await waitForTarget(20000);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let nextId = 1;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id || !pending.has(message.id)) return;
      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handlers.reject(new Error(message.error.message));
      else handlers.resolve(message.result);
    });

    function send(method, params) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }

    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
      if (result.exceptionDetails) {
        throw new Error('Evaluation failed: ' + JSON.stringify(result.exceptionDetails));
      }
      return result.result.value;
    }

    async function waitForDocumentReady() {
      const start = Date.now();
      while (Date.now() - start < 15000) {
        const state = await evaluate('document.readyState');
        if (state === 'complete') return;
        await delay(200);
      }
      throw new Error('Document did not become ready');
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

    const iconsDir = path.join(root, 'icons');
    fs.mkdirSync(iconsDir, { recursive: true });

    for (const job of jobs) {
      const size = job.size;
      await send('Emulation.setDeviceMetricsOverride', {
        width: size,
        height: size,
        deviceScaleFactor: 1,
        mobile: false
      });
      const url = 'file:///' + path.join(root, job.source).split(path.sep).join('/');
      await send('Page.navigate', { url });
      await waitForDocumentReady();
      await delay(300);
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const output = path.join(iconsDir, job.output);
      fs.writeFileSync(output, Buffer.from(shot.data, 'base64'));
      console.log('wrote ' + output + ' (' + size + 'x' + size + ')');
    }

    ws.close();
  } finally {
    chrome.kill();
    await delay(500);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
