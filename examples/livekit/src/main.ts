import { Nosmai, NosmaiError } from '@nosmai/web'
import { Room, RoomEvent, Track } from 'livekit-client'
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

const serverUrl = import.meta.env.VITE_LIVEKIT_URL as string | undefined
const publisherToken = import.meta.env.VITE_LIVEKIT_PUBLISHER_TOKEN as string | undefined
const viewerToken = import.meta.env.VITE_LIVEKIT_VIEWER_TOKEN as string | undefined

let publisher: Room | null = null
let viewer: Room | null = null
let outputTrack: MediaStreamTrack | null = null
let remoteVideo: HTMLVideoElement | null = null
let statsTimer: number | null = null
let previousFrames = 0

const setState = (message: string) => { state.textContent = message }

function startStats(video: HTMLVideoElement) {
  if (statsTimer !== null) window.clearInterval(statsTimer)
  previousFrames = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0
  statsTimer = window.setInterval(() => {
    const frames = video.getVideoPlaybackQuality?.().totalVideoFrames ?? previousFrames
    const fps = frames - previousFrames
    previousFrames = frames
    stats.textContent = `${video.videoWidth || '—'} × ${video.videoHeight || '—'} · ${fps} fps`
  }, 1000)
}

async function stop(resetState = true) {
  if (statsTimer !== null) window.clearInterval(statsTimer)
  statsTimer = null
  if (outputTrack && publisher) {
    await publisher.localParticipant.unpublishTrack(outputTrack).catch(() => undefined)
    Nosmai.instance.output.release()
  }
  outputTrack = null
  await Promise.allSettled([publisher?.disconnect(), viewer?.disconnect()])
  publisher = null
  viewer = null
  remoteVideo?.remove()
  remoteVideo = null
  Nosmai.instance.camera.stop()
  stopButton.disabled = true
  form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = false
  if (resetState) setState('stopped')
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const startButton = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  startButton.disabled = true
  try {
    if (!serverUrl || !publisherToken || !viewerToken) {
      throw new Error('local LiveKit configuration is missing; run npm run setup:local')
    }
    setState('starting Nosmai…')
    const result = await Nosmai.initialize(keyInput.value, { assetBase: '/nosmai' })
    if (!result.ok && result.error) throw result.error
    await Nosmai.instance.attach(canvas)
    await Nosmai.instance.camera.start({ position: 'front' })
    Nosmai.instance.beauty.setSkinSmoothing(Number(smoothing.value))

    viewer = new Room({ adaptiveStream: false, dynacast: false })
    viewer.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Video) return
      remoteVideo?.remove()
      const video = track.attach() as HTMLVideoElement
      remoteVideo = video
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      remote.appendChild(video)
      video.addEventListener('loadedmetadata', () => startStats(video), { once: true })
    })

    publisher = new Room({ adaptiveStream: false, dynacast: false })
    setState('connecting viewer…')
    await viewer.connect(serverUrl, viewerToken)
    setState('connecting publisher…')
    await publisher.connect(serverUrl, publisherToken)

    outputTrack = Nosmai.instance.output.videoTrack()
    await publisher.localParticipant.publishTrack(outputTrack, {
      name: 'nosmai-camera',
      source: Track.Source.Camera,
      simulcast: false,
    })
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
