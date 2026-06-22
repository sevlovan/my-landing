const { spawn } = require('child_process')

// Wait for Vite to be ready, then launch Electron
setTimeout(() => {
  const proc = spawn('electron', ['.'], { stdio: 'inherit', shell: true })
  proc.on('close', code => process.exit(code ?? 0))
}, 4000)
