# @nosmai/web

Real-time face effects for the web. The Nosmai engine compiled to WebAssembly,
with a small wrapper around it.

> **Alpha.** The API will change. See "Licensing" before shipping anything.

## Install

```sh
npm install @nosmai/web
```

The package download is approximately 16 MB and installs to approximately 32
MB. Runtime assets are fetched separately from your application JavaScript.

Copy `engine/`, `engine-baseline/`, and `models/` from `@nosmai/web` to a public
directory and pass that directory as `assetBase`. The runnable
[vanilla and React examples](./examples) automate this in their
`prepare:assets` script.

## Use

### React

```tsx
import { Nosmai } from '@nosmai/web'
import { NosmaiCameraPreview } from '@nosmai/web/react'

await Nosmai.initialize('NOSMAI-…', { assetBase: '/nosmai' })

<NosmaiCameraPreview
  effect="/effects/bunny.nosmai"
  mirror="auto"
  facingMode="front"
  onInitialized={() => setStatus('Camera ready')}
  onError={(e) => showError(e.userMessage, e.recoveryActions)}
/>
```

The component owns the canvas and the camera. `effect`, `mirror` and
`facingMode` are props rather than imperative calls — change one and it applies
in place, with no remount and nothing to re-apply afterwards.

### Anywhere else

```ts
import { Nosmai } from '@nosmai/web'

const result = await Nosmai.initialize('NOSMAI-…', { assetBase: '/nosmai' })
if (!result.ok) throw result.error

const nosmai = Nosmai.instance
await nosmai.attach(canvas)              // must be in the document
await nosmai.camera.start({ position: 'front' })
await nosmai.effects.apply('/effects/bunny.nosmai')
```

### The surface

```
Nosmai.initialize(key, options?)  -> InitializeResult   (static, idempotent)
Nosmai.instance                   -> the singleton

  .attach(canvas)  .dispose()
  .isInitialized   .isProcessing   .licenceState
  .on(event, handler) -> unsubscribe

  .camera      start(opts) stop() switchCamera() setMirror(mode)
               isRunning position list()
  .effects     apply(urlOrBytes) clear() active
  .beauty      setSkinSmoothing(0..1) setSkinWhitening(0..1)
               setTeethWhitening(0..1) setEyeColor(colour, amount)
               clear() activeMask
    .reshape   set(ReshapeType, value)  clear()
    .makeup    apply(layer, style, colour, amount) remove(layer) clear()
  .hair        setColor(colour, amount) clear()
  .background  blur(0..1) color(colour, alpha) image(src) clear()
  .color       setBrightness setContrast setHsb setWhiteBalance
               setRgb setGrayscale setLut setLutIntensity clear()
  .cloud       list(opts) download(id, onProgress) apply(id, onProgress)
```

Events: `ready`, `error`, `licenseStatusChanged`, `faceDetected`, `fps`.

### Values that are not 0..1

Most amounts are 0..1, but three groups are not, and getting them wrong looks
like the SDK ignoring you:

- **Reshape is SIGNED.** 0 is neutral and the sign is the direction — `faceSlim`
  narrows at +1 and widens at −1. The useful magnitude differs per axis
  (`eyeSize` to 1.3, `noseSize` to 0.5); see `RESHAPE_RANGE`. Values are not
  clamped, because the right bound is a UI decision.
- **White balance is in KELVIN: 5000 is neutral**, not 0. Zero is the cold
  extreme of the scale.
- **Contrast, saturation and the RGB gains are multipliers: 1.0 is neutral.**
  `setContrast(0)` renders black. Use `color.clear()` to turn a stage off.
- **`noseSize` above 0 SHRINKS the nose.** It matches the mobile SDKs, which
  name the axis after the control rather than the direction.

### Colours

Anywhere a colour is taken, pass `'#rrggbb'` or `{ r, g, b }` with each channel
0..1. `rgbFromHex` is exported if you need the conversion yourself.

### Performance

Enable only the effects the experience currently needs. Return adjustable
effects to their neutral values when they are no longer visible, and call the
relevant group's `clear()` method when the effect will not be reused soon.

### Errors

`NosmaiError` carries `type`, `userMessage`, `recoveryActions` and
`isRecoverable` — ported from the Flutter SDK, so the same dialog code works:

```ts
catch (e) {
  if (e instanceof NosmaiError) {
    show(e.userMessage, e.recoveryActions)
  }
}
```

## Licensing

`@nosmai/web` requires a Nosmai licence key. Create and manage keys in
[Nosmai Console](https://console.nosmai.com/), then pass the key to
`Nosmai.initialize`. Keep production keys out of source control.

The package is proprietary software distributed under the terms in
[LICENSE](./LICENSE).

## Browser support

WebGL2 and WebAssembly SIMD are required. The package ships two engines and
selects between them with a WebAssembly feature probe before loading either
module:

- `engine/` uses relaxed SIMD for Chrome, Edge, Firefox and compatible Android
  browsers.
- `engine-baseline/` uses portable SIMD128 for Safari and iOS.

Applications normally do not need to select an engine themselves.

## Examples and streaming

- [Vanilla TypeScript, React, LiveKit, and Agora loopback examples](./examples)
- [LiveKit, Agora, Twilio, Daily, Cloudflare Realtime, and plain WebRTC](./STREAMING.md)
