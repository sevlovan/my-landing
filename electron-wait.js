const http = require('http')
const { spawn } = require('child_process')

let attempts = 0

function tryLaunch() {
  attempts++
  const req = http.get({ hostname: '127.0.0.1', port: 5173, path: '/', timeout: 1500 }, () => {
    console.log(`[electron-wait] Vite ready after ${attempts} attempts — launching Electron`)
    const proc = spawn('electron', ['.'], { stdio: 'inherit', shell: true })
    proc.on('close', code => process.exit(code ?? 0))
  })
  req.on('error', () => setTimeout(tryLaunch, 500))
  req.on('timeout', () => { req.destroy(); setTimeout(tryLaunch, 500) })
}

console.log('[electron-wait] Waiting for Vite on 127.0.0.1:5173...')
tryLaunch()
