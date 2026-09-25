# Nosmai + Agora loopback

This example publishes `Nosmai.instance.output.videoTrack()` as an Agora custom
video track, then receives it through a second Agora client in the same page.
Seeing the right-hand video proves the composed output—not the raw camera—made
the complete network round trip.

The example deliberately pins Agora's custom track to a quality-first 1280×720
at 30 fps profile and displays source, capture, send, and receive dimensions.
This makes an encoder or network downgrade visible instead of leaving a blurry
picture to guess at. A production call may prefer `balanced` or `motion` so a
constrained connection can trade resolution for continuity.

## Local setup

1. Copy `.env.example` to `.env.agora.local`.
2. Put the Agora App ID and primary certificate in that ignored file.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:5184` and enter a Nosmai web license key.

`setup-local-agora.mjs` keeps the certificate server-side and writes two
UID-bound, 24-hour test tokens to ignored `.env.local`. Never put an App
Certificate in a variable prefixed with `VITE_`: Vite deliberately exposes
those variables to browser code.

The primary and secondary certificates are both signing secrets. Only one is
needed to generate a token; the secondary exists for credential rotation.
Production applications should obtain tokens from their own authenticated
backend rather than generating them in a checkout.
