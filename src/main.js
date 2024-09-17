const {app, BrowserWindow, ipcMain, dialog} = require("electron")
const path = require("path")
let mainWindow = null
let loadingWindow = null

function createWindow(url, options={}) {
    const defaultOptions = {
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
            
        }
    }
    //assign会后面的覆盖前面的
    options = Object.assign(defaultOptions, options)
    const win = new BrowserWindow(options)
    win.loadFile(path.join(__dirname, url))
    return win
}

function createLoadingWindow() {
    /*loadingWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    })

    loadingWindow.loadFile("./src/loading.html")*/
    const options = {
        width: 400,
        height: 300,
        frame: false
    }
    loadingWindow = createWindow("./loading.html", options)
}

function createMainWindow() {
    /*mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    })
    mainWindow.loadFile("./src/index.html")
    */
    mainWindow = createWindow("./index.html", {
        show: false
    })
}

app.on("ready", ()=> {
    createLoadingWindow()
    createMainWindow()

})

app.on("window-all-closed", ()=> {
    if(process.platform !== "darwin") {
        app.quit()
    }
})

ipcMain.on("loading:done", (event)=> {
    loadingWindow.close()
    mainWindow.show()
})

ipcMain.on("window:open", (event, settings)=> {
    const parentWindow = BrowserWindow.fromWebContents(event.sender)
    const {url, options, confirm} = settings
    options.parent = parentWindow
    const win = createWindow(url, options)
    if(confirm) {
        win.on("close", async (event)=> {
            event.preventDefault()
            const {response} = await dialog.showMessageBox({title: "温馨提示", message: "确认关闭吗?", buttons: ["确认", "取消"]})
            if(response !== 0) {
                return
            }
            win.destroy()
        })
    }
})

ipcMain.handle("dialog:message-box", async(event, options)=> {
    return await dialog.showMessageBox(options)
})

ipcMain.on("window:close", (event, options)=> {
    const window = BrowserWindow.fromWebContents(event.sender)
    force ? window.destroy() : window.close()
    
})