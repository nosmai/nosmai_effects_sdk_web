# Nosmai + LiveKit loopback

This page proves the browser integration end to end on one machine. It connects
two participants to a local LiveKit room: one publishes
`Nosmai.instance.output.videoTrack()`, and the other subscribes and displays the
received track beside the local canvas.

Prerequisites: `livekit-server` and `lk` on `PATH`.

```sh
npm install
npm run dev
```

The dev command starts `livekit-server --dev` when necessary, creates two
24-hour local participant tokens, stores them in ignored `.env.local`, copies
runtime assets from the installed SDK, and serves the page at
http://localhost:5182.

Enter a Nosmai key whose allowed domains include `localhost`, then select
**Start loopback**. The right-hand video is received through LiveKit rather
than displaying the SDK canvas directly. Resolution and decoded FPS update once
per second.
