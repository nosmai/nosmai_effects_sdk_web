import { Nosmai, NosmaiError } from '@nosmai/web'
import AgoraRTC, {
  type IAgoraRTCClient,
  type ILocalVideoTrack,
  type UID,
} from 'agora-rtc-sdk-ng'
import './style.css'

const form = document.querySelector<HTMLFormElement>('#start-form')!
const keyInput = document.querySelector<HTMLInputElement>('#license-key')!
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
const remote = document.querySelector<HTMLElement>('#remote')!
const state = document.querySelector<HTMLElement>('#state')!
const smoothing = document.querySelector<HTMLInputElement>('#smoothing')!
const effect = document.querySelector<HTMLInputElement>('#effect')!
const stats = document.querySelector<HTMLElement>('#stats')!

const appId = import.meta.env.VITE_AGORA_APP_ID as string | undefined
const channel = import.meta.env.VITE_AGORA_CHANNEL as string | undefined
const publisherToken = import.meta.env.VITE_AGORA_PUBLISHER_TOKEN as string | undefined
const viewerToken = import.meta.env.VITE_AGORA_VIEWER_TOKEN as string | undefined
const publisherUid = Number(import.meta.env.VITE_AGORA_PUBLISHER_UID)
const viewerUid = Number(import.meta.env.VITE_AGORA_VIEWER_UID)

let publisher: IAgoraRTCClient | null = null
let viewer: IAgoraRTCClient | null = null
let agoraVideo: ILocalVideoTrack | null = null
let outputTrack: MediaStreamTrack | null = null
let statsTimer: number | null = null

const setState = (message: string) => { state.textContent = message }

function startStats() {
  if (statsTimer !== null) window.clearInterval(statsTimer)
  statsTimer = window.setInterval(() => {
    const sent = publisher?.getLocalVideoStats()
    const received = viewer?.getRemoteVideoStats()[String(publisherUid)]
    const source = `${canvas.width || '—'}×${canvas.height || '—'}`
    const capture = sent
      ? `${sent.captureResolutionWidth}×${sent.captureResolutionHeight}` : '—×—'
    const send = sent
      ? `${sent.sendResolutionWidth}×${sent.sendResolutionHeight} @ ${sent.sendFrameRate ?? '—'} fps`
      : '—×—'
    const receive = received
      ? `${received.receiveResolutionWidth}×${received.receiveResolutionHeight} @ ${received.receiveFrameRate ?? '—'} fps`
      : '—×—'
    const bitrate = sent ? `${Math.round(sent.sendBitrate / 1000)} kbps` : '— kbps'
    stats.textContent = `source ${source} · capture ${capture} · send ${send} · receive ${receive} · ${bitrate}`
  }, 1000)
}

async function stop(resetState = true) {
  if (statsTimer !== null) window.clearInterval(statsTimer)
  statsTimer = null

  if (agoraVideo && publisher) {
    await publisher.unpublish(agoraVideo).catch(() => undefined)
  }
  agoraVideo?.stop()
  agoraVideo?.close()
  agoraVideo = null
  if (outputTrack) Nosmai.instance.output.release()
  outputTrack = null

  await Promise.allSettled([publisher?.leave(), viewer?.leave()])
  publisher = null
  viewer = null
  remote.replaceChildren()
  Nosmai.instance.camera.stop()
  stats.textContent = 'source —×— · capture —×— · send —×— · receive —×—'
  stopButton.disabled = true
  form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = false
  if (resetState) setState('stopped')
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const startButton = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  startButton.disabled = true
  try {
    if (!appId || !channel || !publisherToken || !viewerToken ||
        !Number.isInteger(publisherUid) || !Number.isInteger(viewerUid)) {
      throw new Error('local Agora configuration is missing; run npm run setup:local')
    }

    setState('starting Nosmai…')
    const result = await Nosmai.initialize(keyInput.value, { assetBase: '/nosmai' })
    if (!result.ok && result.error) throw result.error
    await Nosmai.instance.attach(canvas)
    await Nosmai.instance.camera.start({ position: 'front' })
    Nosmai.instance.beauty.setSkinSmoothing(Number(smoothing.value))

    viewer = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    publisher = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    viewer.on('user-published', async (user, mediaType) => {
      if (!viewer) return
      await viewer.subscribe(user, mediaType)
      if (mediaType === 'video') {
        remote.replaceChildren()
        user.videoTrack?.play(remote)
        window.setTimeout(startStats, 100)
      } else {
        user.audioTrack?.play()
      }
    })
    const tokenWarning = () => setState('Agora token expiring; restart the dev server')
    viewer.on('token-privilege-will-expire', tokenWarning)
    publisher.on('token-privilege-will-expire', tokenWarning)

    setState('connecting viewer…')
    await viewer.join(appId, channel, viewerToken, viewerUid as UID)
    setState('connecting publisher…')
    await publisher.join(appId, channel, publisherToken, publisherUid as UID)

    outputTrack = Nosmai.instance.output.videoTrack()
    agoraVideo = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: outputTrack,
      // This loopback is a quality/integration test, so make every encoder
      // input explicit and preserve 720p. Production apps can choose
      // `balanced` or `motion` when adapting resolution is preferable to a
      // frame-rate drop on a constrained connection.
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrateMin: 1000,
      bitrateMax: 2500,
      minDownscaleWidth: 960,
      minDownscaleHeight: 540,
      optimizationMode: 'detail',
    })
    await publisher.publish(agoraVideo)
    setState('publishing')
    stopButton.disabled = false
  } catch (error) {
    const message = error instanceof NosmaiError ? error.userMessage
      : error instanceof Error ? error.message : String(error)
    setState(`failed: ${message}`)
    await stop(false)
  }
})

stopButton.addEventListener('click', () => { void stop() })
smoothing.addEventListener('input', () => {
  Nosmai.instance.beauty.setSkinSmoothing(Number(smoothing.value))
})
effect.addEventListener('change', async () => {
  const file = effect.files?.[0]
  if (file) await Nosmai.instance.effects.apply(file)
})

window.addEventListener('beforeunload', () => {
  if (outputTrack) Nosmai.instance.output.release()
})
