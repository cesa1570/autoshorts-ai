const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { renderVideo } = require('./renderProcess.cjs');
const { VertexAI } = require('@google-cloud/vertexai');

const isDev = !app.isPackaged;


function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#050505',
        titleBarStyle: 'hidden', // Custom title bar
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#ffffff',
            height: 30
        },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    if (isDev) {
        win.loadURL('http://localhost:3005');
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle external links
    win.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

});

// Specific API to cancel WebAuthn flows in newer Electron versions
app.on('session-created', (session) => {
    session.setDisplayMediaRequestHandler((request, callback) => {
        callback({ video: null, audio: null });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('app:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});

ipcMain.handle('app:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.handle('app:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});

// File System - Save Project
ipcMain.handle('file:save-project', async (event, { filename, content }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Save Project',
        defaultPath: path.join(app.getPath('documents'), `${filename}.json`),
        filters: [{ name: 'JSON Project', extensions: ['json'] }]
    });

    if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        return { success: true, path: filePath };
    }
    return { canceled: true };
});

// Video Saving - Support for Hybrid Render
ipcMain.handle('video:save', async (event, { data, filename }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Save Produced Video',
        defaultPath: path.join(app.getPath('videos'), filename || `video_${Date.now()}.mp4`),
        filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    });

    if (filePath) {
        try {
            // Data is expected as a Buffer or Uint8Array
            fs.writeFileSync(filePath, Buffer.from(data));
            return { success: true, path: filePath };
        } catch (error) {
            console.error('Save error:', error);
            return { success: false, error: error.message };
        }
    }
    return { canceled: true };
});

// Video Rendering - Local FFmpeg
ipcMain.handle('video:render', async (event, { scenes, dimensions }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export Video',
        defaultPath: path.join(app.getPath('videos'), `video_${Date.now()}.mp4`),
        filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    });

    if (filePath) {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);

            const result = await renderVideo({
                scenes,
                outputPath: filePath,
                dimensions
            }, (progress) => {
                // Send progress back to the specific window
                win.webContents.send('video:render-progress', progress);
            });

            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { canceled: true };
});
// Auth - Native Window Flow
ipcMain.handle('auth:start-flow', async (event, authUrl) => {
    return new Promise((resolve) => {
        const authWindow = new BrowserWindow({
            width: 600,
            height: 750,
            show: true,
            alwaysOnTop: true,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
                // No partitions, no complex settings - stick to defaults
            }
        });

        // Use a very high-reputation standard Chrome UA
        authWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        const handleUrl = (url) => {
            if (url.includes('/auth/callback')) {
                try {
                    const rawUrl = new URL(url);
                    const code = rawUrl.searchParams.get('code');

                    if (code) {
                        resolve({ success: true, code });
                        authWindow.close(); // Only close on successful code retrieval
                    }
                } catch (e) { console.error("URL Parse error", e); }
            }
        };

        // Capture redirects and navigation
        authWindow.webContents.on('did-navigate', (e, url) => handleUrl(url));
        authWindow.webContents.on('did-get-redirect-request', (e, oldUrl, newUrl) => handleUrl(newUrl));

        authWindow.on('closed', () => {
            resolve({ success: false, error: 'Window closed' });
        });

        authWindow.loadURL(authUrl);
    });
});

// Vertex AI - Node-side Handler to avoid Browser Issues
let vertexInstance = null;
let currentVertexConfig = null;

ipcMain.handle('vertex:generate-content', async (event, { config, modelId, prompt, systemInstruction }) => {
    try {
        // --- API KEY MODE (REST Fallback) ---
        if (config.apiKey) {
            // If user provides a raw API Key, bypass strict SDK auth and use REST
            // Use global publisher endpoint which infers project from key
            // Form: https://aiplatform.googleapis.com/v1/publishers/google/models/{MODEL}:generateContent?key={API_KEY}

            const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${modelId}:generateContent?key=${config.apiKey}`;

            const payload = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            };

            if (systemInstruction) {
                payload.system_instruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Vertex REST Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return {
                success: true,
                text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
                usage: data.usageMetadata
            };
        }

        // --- SERVICE ACCOUNT MODE (Node SDK) ---
        // Simple singleton to reuse instance if config is same
        if (!vertexInstance || JSON.stringify(currentVertexConfig) !== JSON.stringify(config)) {
            // Check if config has credentials (JSON key)
            const options = {
                project: config.projectId,
                location: config.location
            };

            // If a JSON Key is provided (content or path), use it via googleAuthOptions
            if (config.serviceAccountKey) {
                try {
                    // Try parsing as JSON first (if user pasted content)
                    const credentials = JSON.parse(config.serviceAccountKey);
                    options.googleAuthOptions = { credentials };
                } catch (e) {
                    // If parse fails, assume it's a file path
                    options.googleAuthOptions = { keyFile: config.serviceAccountKey };
                }
            }
            // Note: Node SDK doesn't support 'apiKey' effectively for server-side auth usually

            vertexInstance = new VertexAI(options);
            currentVertexConfig = config;
        }

        const model = vertexInstance.getGenerativeModel({
            model: modelId,
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return {
            success: true,
            text: response.candidates?.[0]?.content?.parts?.[0]?.text || '',
            usage: response.usageMetadata
        };
    } catch (error) {
        console.error("Main Process Vertex AI Error:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('vertex:generate-image', async (event, { config, prompt, aspectRatio }) => {
    try {
        // --- API KEY MODE (REST Fallback) ---
        if (config.apiKey) {
            // Use global publisher endpoint for prediction
            // Form: https://aiplatform.googleapis.com/v1/publishers/google/models/imagen-3.0-generate-001:predict?key={API_KEY}
            const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/imagen-3.0-generate-001:predict?key=${config.apiKey}`;

            const payload = {
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1, aspectRatio: aspectRatio || "1:1" }
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Vertex Image REST Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            // Vertex Predict API returns { predictions: [ { bytesBase64Encoded: "..." } ] }
            const b64 = data.predictions?.[0]?.bytesBase64Encoded || data.predictions?.[0]; // sometimes returns raw string depending on version

            if (b64) {
                // Check if it's an object or string
                const finalB64 = typeof b64 === 'string' ? b64 : b64.bytesBase64Encoded;
                return { success: true, data: `data:image/png;base64,${finalB64}` };
            }
            return { success: false, error: "No image data in REST response" };
        }

        if (!vertexInstance || JSON.stringify(currentVertexConfig) !== JSON.stringify(config)) {
            const options = {
                project: config.projectId,
                location: config.location
            };

            if (config.serviceAccountKey) {
                try {
                    const credentials = JSON.parse(config.serviceAccountKey);
                    options.googleAuthOptions = { credentials };
                } catch (e) {
                    options.googleAuthOptions = { keyFile: config.serviceAccountKey };
                }
            }

            vertexInstance = new VertexAI(options);
            currentVertexConfig = config;
        }

        // For Imagen on Vertex, handle via generative model or specific endpoint?
        // Standard SDK approach:
        const model = vertexInstance.getGenerativeModel({ model: 'imagen-3.0-generate-001' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const response = await result.response;
        const part = response.candidates?.[0]?.content?.parts?.[0];

        if (part?.inlineData) {
            return {
                success: true,
                data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            };
        }

        return { success: false, error: "No image data returned from Vertex" };
    } catch (error) {
        console.error("Main Process Vertex Image Error:", error);
        return { success: false, error: error.message };
    }
});

// Proxy Request for CORS (Existing - keep if needed, or remove if using above)
// ... keeping existing handlers ...
