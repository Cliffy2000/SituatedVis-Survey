const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
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
const sequenceArg = args.find(arg => arg.startsWith('--sequence='));

let sequence = [];
let currentIndex = 0;
let presetConfig = null;
let spawnedProcesses = [];

if (presetArg) {
    const presetName = presetArg.split('=')[1];
    sequence = [presetName];
    console.log(`Using preset: ${presetName}`);
} else if (sequenceArg) {
    const sequenceName = sequenceArg.split('=')[1];
    try {
        const configData = fs.readFileSync('config.json', 'utf8');
        const config = JSON.parse(configData);
        sequence = config[sequenceName];
        if (!sequence || !Array.isArray(sequence)) {
            console.error(`Sequence "${sequenceName}" not found in config.json`);
            process.exit(1);
        }
        console.log(`Using sequence: ${sequenceName} with ${sequence.length} presets`);
    } catch (err) {
        console.error('Error loading config.json:', err.message);
        process.exit(1);
    }
}

// Load current preset config
if (sequence.length > 0) {
    try {
        const configData = fs.readFileSync('config.json', 'utf8');
        const config = JSON.parse(configData);
        presetConfig = config[sequence[currentIndex]];
        if (!presetConfig) {
            console.error(`Preset "${sequence[currentIndex]}" not found in config.json`);
            process.exit(1);
        }
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
    if (req.method === 'POST' && req.url === '/trigger-next') {
        const nextIndex = currentIndex + 1;
        if (nextIndex < sequence.length) {
            const nextPreset = sequence[nextIndex];
            const nextPort = PORT + nextIndex;
            
            const child = spawn('node', ['server.js', `--preset=${nextPreset}`], {
                stdio: 'inherit',
                env: { ...process.env, PORT: nextPort }
            });
            
            spawnedProcesses.push(child);
            
            child.on('error', (err) => {
                console.error('Failed to spawn child process:', err);
            });
            
            child.on('exit', (code, signal) => {
                console.log(`Child process exited with code ${code} and signal ${signal}`);
                // Remove from tracked processes
                const index = spawnedProcesses.indexOf(child);
                if (index > -1) {
                    spawnedProcesses.splice(index, 1);
                }
            });
            
            console.log(`Spawning next instance on port ${nextPort} with preset ${nextPreset}`);
            console.log(`Child process PID: ${child.pid}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, preset: nextPreset, port: nextPort }));
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Sequence complete' }));
        }
        return;
    }
    
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

    if (sequence.length > 0) {
        console.log(`Loaded sequence with ${sequence.length} preset(s): ${sequence.join(', ')}`);
        console.log(`Current preset: ${sequence[currentIndex]}`);
    }

    // Auto-open browser
    const platform = process.platform;
    const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
    console.log(`Auto-opening browser with command: ${cmd} ${url}`);
    exec(`${cmd} ${url}`);
});

// Clean up spawned processes on exit
let cleanupCalled = false;
function cleanup() {
    if (cleanupCalled) return;
    cleanupCalled = true;
    
    let cleanedCount = 0;
    spawnedProcesses.forEach(child => {
        if (child && !child.killed) {
            child.kill('SIGTERM');
            cleanedCount++;
        }
    });
    
    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} spawned process(es)`);
    }
    
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);