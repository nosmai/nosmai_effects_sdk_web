import {
  BlusherStyle, EyelashStyle, EyeshadowStyle, LipstickStyle, MakeupLayer,
  Nosmai, NosmaiError, RESHAPE_LABELS, RESHAPE_RANGE, ReshapeType,
  type NosmaiEffect,
} from '@nosmai/web'
import './style.css'

const get = <T extends Element>(selector: string) => document.querySelector<T>(selector)!
const form = get<HTMLFormElement>('#start-form')
const keyInput = get<HTMLInputElement>('#license-key')
const canvas = get<HTMLCanvasElement>('#preview')
const controls = get<HTMLElement>('#controls')
const localEffect = get<HTMLInputElement>('#local-effect')
const status = get<HTMLElement>('#status')
const cloudSelect = get<HTMLSelectElement>('#cloud-filter')
const cloudApply = get<HTMLButtonElement>('#cloud-apply')
let cloudEffects: NosmaiEffect[] = []

const report = (message: string) => { status.textContent = message }
const messageFor = (error: unknown) => error instanceof NosmaiError
  ? error.userMessage : error instanceof Error ? error.message : String(error)
const run = async (operation: () => void | Promise<void>) => {
  try { await operation() } catch (error) { report(messageFor(error)) }
}

Nosmai.instance.on('licenseStatusChanged', (state) => {
  report(`License: ${state.status} · watermark: ${state.watermarked ? 'on' : 'off'}`)
})
Nosmai.instance.on('error', (error) => report(error.userMessage))

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const button = form.querySelector<HTMLButtonElement>('button')!
  button.disabled = true
  void run(async () => {
    const result = await Nosmai.initialize(keyInput.value, { assetBase: '/nosmai' })
    if (!result.ok && result.error) throw result.error
    await Nosmai.instance.attach(canvas)
    await Nosmai.instance.camera.start({ position: 'front' })
    controls.hidden = false
    form.hidden = true
    report('Camera running. Choose an effect or adjust the controls.')
  }).finally(() => { button.disabled = form.hidden })
})

// Local and cloud packages share the same engine apply path.
localEffect.addEventListener('change', () => void run(async () => {
  const file = localEffect.files?.[0]
  if (!file) return
  report(`Loading ${file.name}…`)
  await Nosmai.instance.effects.apply(file)
  report(`Applied local filter: ${file.name}`)
}))
get<HTMLButtonElement>('#effect-clear').addEventListener('click', () => void run(async () => {
  await Nosmai.instance.effects.clear()
  localEffect.value = ''
  report('Filter cleared.')
}))

get<HTMLButtonElement>('#cloud-load').addEventListener('click', () => void run(async () => {
  report('Loading cloud filter catalogue…')
  const page = await Nosmai.instance.cloud.list({ limit: 100 })
  cloudEffects = page.items
  cloudSelect.replaceChildren(...cloudEffects.map((effect) => {
    const option = document.createElement('option')
    option.value = effect.id
    option.textContent = `${effect.displayName} · ${effect.category}`
    return option
  }))
  cloudSelect.disabled = cloudEffects.length === 0
  cloudApply.disabled = cloudEffects.length === 0
  report(`Loaded ${cloudEffects.length} of ${page.total} cloud filters.`)
}))
cloudApply.addEventListener('click', () => void run(async () => {
  const effect = cloudEffects.find((item) => item.id === cloudSelect.value)
  if (!effect) return
  report(`Downloading ${effect.displayName}…`)
  const bytes = await Nosmai.instance.cloud.download(effect.id, (fraction) => {
    report(`Downloading ${effect.displayName}… ${Math.round(fraction * 100)}%`)
  })
  await Nosmai.instance.effects.apply(bytes)
  report(`Applied cloud filter: ${effect.displayName}`)
}))

const bindLevel = (selector: string, setter: (value: number) => void) => {
  get<HTMLInputElement>(selector).addEventListener('input', (event) => {
    setter(Number((event.currentTarget as HTMLInputElement).value))
  })
}
bindLevel('#smoothing', (value) => Nosmai.instance.beauty.setSkinSmoothing(value))
bindLevel('#whitening', (value) => Nosmai.instance.beauty.setSkinWhitening(value))
bindLevel('#sharpening', (value) => Nosmai.instance.beauty.setSharpening(value))

// A zero makeup strength removes the layer, avoiding a dormant render pass.
const makeupControls = [
  { id: 'lips', layer: MakeupLayer.lipstick, style: LipstickStyle.beautyV3 },
  { id: 'blush', layer: MakeupLayer.blusher, style: BlusherStyle.beautyV3 },
  { id: 'eyelash', layer: MakeupLayer.eyelash, style: EyelashStyle.beautyV3 },
  { id: 'eyeshadow', layer: MakeupLayer.eyeshadow, style: EyeshadowStyle.beautyV3 },
] as const
for (const item of makeupControls) {
  const colour = get<HTMLInputElement>(`#${item.id}-color`)
  const intensity = get<HTMLInputElement>(`#${item.id}-intensity`)
  const apply = () => {
    const value = Number(intensity.value)
    if (value <= 0.001) Nosmai.instance.beauty.makeup.remove(item.layer)
    else Nosmai.instance.beauty.makeup.apply(item.layer, item.style, colour.value, value)
  }
  colour.addEventListener('input', apply)
  intensity.addEventListener('input', apply)
}

const lensColor = get<HTMLInputElement>('#lens-color')
const lensIntensity = get<HTMLInputElement>('#lens-intensity')
const applyLens = () => Nosmai.instance.beauty.setEyeColor(
  lensColor.value, Number(lensIntensity.value),
)
lensColor.addEventListener('input', applyLens)
lensIntensity.addEventListener('input', applyLens)
get<HTMLButtonElement>('#makeup-clear').addEventListener('click', () => {
  Nosmai.instance.beauty.makeup.clear()
  Nosmai.instance.beauty.setEyeColorIntensity(0)
  for (const item of makeupControls) get<HTMLInputElement>(`#${item.id}-intensity`).value = '0'
  lensIntensity.value = '0'
  report('Makeup and eye lens cleared.')
})

// Generate every reshape axis from the SDK's own labels and engine limits.
const reshapeGrid = get<HTMLElement>('#reshape-grid')
for (const type of Object.values(ReshapeType)) {
  const label = document.createElement('label')
  const input = document.createElement('input')
  const limit = RESHAPE_RANGE[type]
  input.type = 'range'; input.min = String(-limit); input.max = String(limit)
  input.step = '0.01'; input.value = '0'
  input.addEventListener('input', () => Nosmai.instance.beauty.reshape.set(type, Number(input.value)))
  label.append(RESHAPE_LABELS[type], input)
  reshapeGrid.append(label)
}
get<HTMLButtonElement>('#reshape-clear').addEventListener('click', () => {
  Nosmai.instance.beauty.reshape.clear()
  reshapeGrid.querySelectorAll<HTMLInputElement>('input').forEach((input) => { input.value = '0' })
  report('Reshape cleared.')
})

// Background segmentation.
bindLevel('#background-blur', (value) => Nosmai.instance.background.blur(value))
get<HTMLInputElement>('#background-color').addEventListener('input', (event) => {
  Nosmai.instance.background.color((event.currentTarget as HTMLInputElement).value)
})
get<HTMLInputElement>('#background-image').addEventListener('change', (event) => void run(async () => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0]
  if (file) await Nosmai.instance.background.image(file)
}))
get<HTMLButtonElement>('#background-clear').addEventListener('click', () => {
  Nosmai.instance.background.clear()
  get<HTMLInputElement>('#background-blur').value = '0'
  get<HTMLInputElement>('#background-image').value = ''
  report('Background effect cleared.')
})

// Hair colouring explicitly exercises the separate hair-segmentation model.
const hairColor = get<HTMLInputElement>('#hair-color')
const hairIntensity = get<HTMLInputElement>('#hair-intensity')
const applyHair = () => {
  const value = Number(hairIntensity.value)
  if (value <= 0.001) Nosmai.instance.hair.clear()
  else Nosmai.instance.hair.setColor(hairColor.value, value)
}
hairColor.addEventListener('input', applyHair)
hairIntensity.addEventListener('input', applyHair)
get<HTMLButtonElement>('#hair-clear').addEventListener('click', () => {
  Nosmai.instance.hair.clear()
  hairIntensity.value = '0'
  report('Hair segmentation cleared.')
})
