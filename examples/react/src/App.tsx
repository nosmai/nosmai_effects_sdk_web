import { useRef, useState } from 'react'
import { Nosmai, type NosmaiError } from '@nosmai/web'
import { NosmaiCameraPreview, type NosmaiCameraPreviewHandle } from '@nosmai/web/react'

export function App() {
  const preview = useRef<NosmaiCameraPreviewHandle>(null)
  const [key, setKey] = useState('')
  const [started, setStarted] = useState(false)
  const [effect, setEffect] = useState<Blob | null>(null)
  const [error, setError] = useState<NosmaiError | null>(null)

  const start = async () => {
    const result = await Nosmai.initialize(key, { assetBase: '/nosmai' })
    if (result.error) setError(result.error)
    if (result.ok) setStarted(true)
  }

  return (
    <main>
      <h1>Nosmai Web SDK</h1>
      <p>React example</p>
      {!started ? (
        <form onSubmit={(event) => { event.preventDefault(); void start() }}>
          <input type="password" value={key} onChange={(event) => setKey(event.target.value)}
                 placeholder="NOSMAI-…" autoComplete="off" required />
          <button type="submit">Start camera</button>
        </form>
      ) : (
        <>
          <NosmaiCameraPreview ref={preview} effect={effect} mirror="auto"
            onError={setError} className="preview" />
          <section>
            <label>
              Smoothing
              <input type="range" min="0" max="1" step="0.01" defaultValue="0"
                onChange={(event) => Nosmai.instance.beauty.setSkinSmoothing(
                  Number(event.target.value),
                )} />
            </label>
            <label>
              Local filter
              <input type="file" accept=".nosmai" onChange={(event) => {
                setEffect(event.target.files?.[0] ?? null)
              }} />
            </label>
            <button type="button" onClick={() => setEffect(null)}>Clear filter</button>
          </section>
        </>
      )}
      {error && <p className="error">{error.userMessage}</p>}
    </main>
  )
}
