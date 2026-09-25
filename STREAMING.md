# Publishing Nosmai video to a call

Nosmai renders the camera plus effects into a `<canvas>`. To send that to
Agora, LiveKit, Twilio, Daily, or a plain `RTCPeerConnection`, you need one
thing:

```js
const track = nosmai.output.videoTrack()   // a MediaStreamTrack
```

Every browser RTC SDK accepts a `MediaStreamTrack`, so the same output works
with each provider below.

---

## Use the output API

Use `nosmai.output.videoTrack()` or `nosmai.output.stream()` for publishing.
Do not create a separate stream from the preview canvas, because that bypasses
the SDK's processed output path.

---

## Lifecycle

Acquire one output per consumer and release it when that consumer is finished:

```js
const track = nosmai.output.videoTrack()
// ... publish it ...
nosmai.output.release()    // when you unpublish or leave the call
```

Recording and publishing can run at the same time.

---

## Agora

```js
import AgoraRTC from 'agora-rtc-sdk-ng'

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
await client.join(APP_ID, CHANNEL, TOKEN, null)

const mic = await AgoraRTC.createMicrophoneAudioTrack()
const video = AgoraRTC.createCustomVideoTrack({
  mediaStreamTrack: nosmai.output.videoTrack(),
  optimizationMode: 'motion',   // AR content is motion, not a slide
})

await client.publish([mic, video])
```

Turn Agora's own beauty / image-enhancement extension **off**. It only applies
to camera tracks, so it will not touch a custom track — but if you enable it on
a separate camera track you will be processing twice.

---

## LiveKit

Two shapes. Prefer the processor: LiveKit then owns the camera, and you get
device switching, mute and republish for free.

### Recommended — as a track processor

```js
import { createLocalVideoTrack, Track } from 'livekit-client'

class NosmaiProcessor {
  name = 'nosmai'

  async init(opts) {
    // LiveKit hands you the camera track and an <video> already playing it.
    await nosmai.camera.start({ stream: new MediaStream([opts.track]) })
    this.processedTrack = nosmai.output.videoTrack()
  }

  async restart(opts) {     // fires on camera switch
    await this.destroy()
    await this.init(opts)
  }

  async destroy() {
    nosmai.output.release()
    this.processedTrack = undefined
  }
}

const cam = await createLocalVideoTrack()
await cam.setProcessor(new NosmaiProcessor())
await room.localParticipant.publishTrack(cam)
```

### Simpler — you own the camera

```js
await nosmai.camera.start()
await room.localParticipant.publishTrack(nosmai.output.videoTrack(), {
  name: 'camera',
  source: Track.Source.Camera,
})
```

---

## Twilio Video

```js
import { connect, LocalVideoTrack } from 'twilio-video'

await nosmai.camera.start()
const room = await connect(TOKEN, {
  tracks: [new LocalVideoTrack(nosmai.output.videoTrack())],
})
```

Twilio also has a `VideoProcessor` interface (`processFrame(input, output)`)
which lets you declare a WebGL output context. It is a reasonable fit, but it
inverts control — Twilio owns the render clock and the output canvas — so the
track above is the simpler path unless you specifically need their pipeline.

---

## Daily

Use `videoSource`. **Not** `startCustomTrack`: that publishes an *additional*
track that remote peers must explicitly subscribe to, and the usual symptom of
getting it wrong is "nobody can see my effects".

```js
import DailyIframe from '@daily-co/daily-js'

await nosmai.camera.start()
const call = DailyIframe.createCallObject({
  videoSource: nosmai.output.videoTrack(),
})
await call.join({ url: ROOM_URL })

// or swap it in on a call already running:
await call.setInputDevicesAsync({ videoSource: nosmai.output.videoTrack() })
```

Leave `audioSource` alone — passing `false` mutes the user. Also set Daily's
own video processor to `{ type: 'none' }` so their blur does not stack on top
of your effects.

---

## Plain WebRTC

```js
await nosmai.camera.start()

const pc = new RTCPeerConnection(config)
pc.addTrack(nosmai.output.videoTrack(), nosmai.output.stream())

// microphone separately, as usual
const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
for (const t of mic.getAudioTracks()) pc.addTrack(t, mic)
```

---

## Cloudflare Realtime (SFU)

Cloudflare's SFU is plain WebRTC — their own example publishes with
`addTransceiver(track, { direction: 'sendonly' })` on a standard
`RTCPeerConnection`. Substitute the Nosmai track for the `getUserMedia` one:

```js
await nosmai.camera.start()

const pc = await createPeerConnection()            // as in their quickstart
const mic = await navigator.mediaDevices.getUserMedia({ audio: true })

const transceivers = [
  pc.addTransceiver(nosmai.output.videoTrack(), { direction: 'sendonly' }),
  ...mic.getAudioTracks().map((t) =>
    pc.addTransceiver(t, { direction: 'sendonly' })),
]

// then their usual offer → /tracks/new → setRemoteDescription flow,
// using transceiver.mid as each track's mid
```

Their higher-level **RealtimeKit** SDK wraps this with prebuilt UI; if you use
that instead, look for its custom-video-source option rather than driving the
peer connection yourself.

---

## Audio

Nosmai publishes **video only**. Every platform above handles the microphone
on its own path, so add your mic track exactly as you would without Nosmai.

An effect's own sound (a game's audio, say) plays locally through Web Audio and
is **not** mixed into the published track.

---

## Backgrounded tabs

Browser scheduling can reduce frame rate while a tab is hidden. If you want to
save power while hidden, pause the effect runtime rather than unpublishing the
track:

```js
document.addEventListener('visibilitychange', () => {
  document.hidden ? nosmai.effects.pause() : nosmai.effects.resume()
})
```
