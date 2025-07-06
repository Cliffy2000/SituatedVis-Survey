const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { JSDOM } = require('jsdom');

const PORT = process.env.PORT || 8000;

const mimeTypes = {
  '.manifest': 'text/cache-manifest',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '': 'application/octet-stream'
};

// Parse command line arguments
const args = process.argv.slice(2);
const presetArg = args.find(arg => arg.startsWith('--preset='));
const presetName = presetArg ? presetArg.split('=')[1] : null;

let presetConfig = null;
if (presetName) {
  try {
    const configData = fs.readFileSync('config.json', 'utf8');
    const config = JSON.parse(configData);
    presetConfig = config[presetName];
    if (!presetConfig) {
      console.error(`Preset "${presetName}" not found in config.json`);
      process.exit(1);
    }
    console.log(`Using preset: ${presetName}`);
  } catch (err) {
    console.error('Error loading config.json:', err.message);
    process.exit(1);
  }
}

function injectPresetValues(html, preset) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Inject preset config as global variable
  const configScript = document.createElement('script');
  configScript.textContent = `window.PRESET_CONFIG = ${JSON.stringify(preset)};`;
  document.head.appendChild(configScript);
  
  // Inject preset handler script
  const presetScript = document.createElement('script');
  presetScript.src = 'preset.js';
  presetScript.defer = true;
  document.head.appendChild(presetScript);
  
  return dom.serialize();
}

const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    
    let content = data;
    
    // If serving index.html and we have a preset, inject values
    if (filePath === '/index.html' && presetConfig) {
      content = injectPresetValues(data.toString(), presetConfig);
    }
    
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running at ${url}`);
  
  if (presetName) {
    console.log(`Preset "${presetName}" loaded and form disabled`);
  }
  
  // Auto-open browser
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} ${url}`);
});