const http = require('http')
const { spawn } = require('child_process')
const electronPath = require('electron')

// Claude Code sets ELECTRON_RUN_AS_NODE=1 which breaks Electron's module system.
// We must remove it from the child environment before launching.
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

let attempts = 0
let launched = false

function tryLaunch() {
  if (launched) return
  attempts++
  const req = http.get(
    { hostname: '127.0.0.1', port: 5173, path: '/', timeout: 1500 },
    () => {
      if (launched) return
      launched = true
      console.log(`[electron-wait] Vite ready after ${attempts} attempts — launching Electron`)
      const proc = spawn(electronPath, ['.'], { stdio: 'inherit', env })
      proc.on('close', code => process.exit(code ?? 0))
    }
  )
  req.on('error', () => { if (!launched) setTimeout(tryLaunch, 500) })
  req.on('timeout', () => { req.destroy(); if (!launched) setTimeout(tryLaunch, 500) })
}

console.log('[electron-wait] Waiting for Vite on 127.0.0.1:5173...')
tryLaunch()
