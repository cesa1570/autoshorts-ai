const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    window: {
        minimize: () => ipcRenderer.invoke('app:minimize'),
        maximize: () => ipcRenderer.invoke('app:maximize'),
        close: () => ipcRenderer.invoke('app:close'),
    },
    fileSystem: {
        saveProject: (filename, content) => ipcRenderer.invoke('file:save-project', { filename, content }),
    },
    video: {
        renderVideo: (config) => ipcRenderer.invoke('render-video', config),
        saveVideo: (data, filename) => ipcRenderer.invoke('video:save', { data, filename }),
        onProgress: (callback) => ipcRenderer.on('video:render-progress', (event, progress) => callback(progress)),
        removeProgressListeners: () => ipcRenderer.removeAllListeners('video:render-progress')
    },
    // New Dedicated Auth Namespace
    auth: {
        startAuthFlow: (url) => ipcRenderer.invoke('auth:start-flow', url),
        exchangeToken: (req) => ipcRenderer.invoke('auth:exchange-token', req) // Moved/Aliased here
    },
    // Keep legacy or fixing bug: Ensure exchangeToken is available where expected?
    // Based on previous code analysis, user might have been calling window.electron.exchangeToken directly?
    // If so, we should expose it at top level or check usage.
    // For now, I'll allow flat access just in case.
    // Dedicated Vertex AI Namespace (Main Process passthrough)
    vertex: {
        generateContent: (args) => ipcRenderer.invoke('vertex:generate-content', args),
        generateImage: (args) => ipcRenderer.invoke('vertex:generate-image', args),
    },
    exchangeToken: (req) => ipcRenderer.invoke('auth:exchange-token', req)
});
