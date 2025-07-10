import { copyFileSync, mkdirSync } from 'fs'
mkdirSync('public/audio', { recursive: true })
copyFileSync(
  'node_modules/@soundtouchjs/audio-worklet/dist/soundtouch-worklet.js',
  'public/js/soundtouch-worklet.js'
)

