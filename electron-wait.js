const { spawn } = require('child_process')
const net = require('net')

function waitForPort(port, cb) {
  const attempt = () => {
    const client = new net.Socket()
    client.connect(port, '127.0.0.1', () => {
      client.destroy()
      cb()
    })
    client.on('error', () => {
      client.destroy()
      setTimeout(attempt, 500)
    })
  }
  attempt()
}

waitForPort(5173, () => {
  const proc = spawn('electron', ['.'], { stdio: 'inherit', shell: true })
  proc.on('close', code => process.exit(code ?? 0))
})
