# Examples

These examples consume `@nosmai/web` the same way as an application. Their
setup commands prepare the runtime assets required by each Vite project.

| Example | What it demonstrates |
| --- | --- |
| [vanilla](./vanilla) | Full feature lab: cloud/local filters, beauty, makeup, reshape, background, and hair segmentation |
| [react](./react) | `NosmaiCameraPreview`, React state, beauty, and a locally selected `.nosmai` file |
| [livekit](./livekit) | Local publish-and-receive loopback with resolution and FPS verification |
| [agora](./agora) | Agora custom-track publish-and-receive loopback using locally generated test tokens |

Run either example with:

```sh
cd examples/vanilla # or examples/react, examples/livekit, examples/agora
npm install
npm run dev
```

Enter a key whose allowed domains include `localhost`.

LiveKit runs against a local development server. Agora needs an App ID and App
Certificate in its ignored `.env.agora.local`; the setup script converts them
to short-lived browser tokens server-side. For Twilio, Daily, Cloudflare
Realtime, and plain WebRTC, see [STREAMING.md](../STREAMING.md).
