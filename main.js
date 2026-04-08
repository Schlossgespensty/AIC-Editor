const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');

function createWindow () {
    const win = new BrowserWindow({
        width: 700,
        height: 1000,
        minWidth: 550,
        minHeight: 300,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    // ✅ Use exe folder in build, project folder in dev
    const exeDir = app.isPackaged
        ? path.dirname(app.getPath('exe'))
        : __dirname;

    const configDir = path.join(exeDir, 'config');
    const defaultDir = path.join(__dirname, 'config');

    // ✅ Ensure config folder exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // ✅ Copy default configs if missing
    if (!fs.existsSync(path.join(configDir, 'template.json'))) {
        if (fs.existsSync(defaultDir)) {
            fs.readdirSync(defaultDir).forEach(file => {
                fs.copyFileSync(
                    path.join(defaultDir, file),
                    path.join(configDir, file)
                );
            });
        }
    }

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


// ---------------- IPC ----------------

ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled) return null;

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');

    return { content, path: filePath };
});


ipcMain.handle('save-file', async (event, content) => {
    const result = await dialog.showSaveDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled) return null;

    const filePath = result.filePath;

    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
});


ipcMain.handle('quick-save-file', async (event, { path, content }) => {
    fs.writeFileSync(path, content, 'utf-8');
    return path;
});


ipcMain.handle('load-config', async (event, file) => {
    try {
        const exeDir = app.isPackaged
            ? path.dirname(app.getPath('exe'))
            : __dirname;

        const filePath = path.join(exeDir, 'config', file);

        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);

    } catch (err) {
        console.error("Failed to load config:", file, err);
        throw err;
    }
});