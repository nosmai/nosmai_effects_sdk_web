import { readFile, writeFile } from 'node:fs/promises'
import tokenPackage from 'agora-token'

const { RtcTokenBuilder, RtcRole } = tokenPackage
const source = await readFile('.env.agora.local', 'utf8').catch(() => '')
const secrets = Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return []
  const split = trimmed.indexOf('=')
  return split < 1 ? [] : [[trimmed.slice(0, split), trimmed.slice(split + 1)]]
}))

const appId = secrets.AGORA_APP_ID?.trim()
const certificate = (secrets.AGORA_PRIMARY_CERT ?? secrets.AGORA_APP_CERTIFICATE)?.trim()
if (!/^[0-9a-f]{32}$/i.test(appId ?? '') ||
    !/^[0-9a-f]{32}$/i.test(certificate ?? '')) {
  throw new Error(
    'Create ignored .env.agora.local with AGORA_APP_ID and AGORA_PRIMARY_CERT. ' +
    'Never prefix the certificate with VITE_ because that would expose it to the browser.',
  )
}

const channel = secrets.AGORA_CHANNEL?.trim() || 'nosmai-web-test'
const publisherUid = 1001
const viewerUid = 1002
const validForSeconds = 24 * 60 * 60
const makeToken = (uid) => RtcTokenBuilder.buildTokenWithUid(
  appId, certificate, channel, uid, RtcRole.PUBLISHER,
  validForSeconds, validForSeconds,
)

await writeFile('.env.local', [
  `VITE_AGORA_APP_ID=${appId}`,
  `VITE_AGORA_CHANNEL=${channel}`,
  `VITE_AGORA_PUBLISHER_UID=${publisherUid}`,
  `VITE_AGORA_VIEWER_UID=${viewerUid}`,
  `VITE_AGORA_PUBLISHER_TOKEN=${makeToken(publisherUid)}`,
  `VITE_AGORA_VIEWER_TOKEN=${makeToken(viewerUid)}`,
  '',
].join('\n'), { mode: 0o600 })

console.log(`wrote two 24-hour Agora tokens for channel ${channel} to ignored .env.local`)
