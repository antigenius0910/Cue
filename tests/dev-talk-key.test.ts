// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

async function load(mode: string) {
  vi.resetModules()
  vi.stubEnv('MODE', mode)
  document.body.innerHTML = '<p id="status"></p>'
  const mod = await import('../src/dev-talk-key')
  mod.installDevTalkKey(document.querySelector<HTMLElement>('#status')!)
  return mod
}

const key = (type: 'keydown' | 'keyup', code = 'AltRight') =>
  window.dispatchEvent(new KeyboardEvent(type, { code, cancelable: true }))

describe('dev speaker key', () => {
  beforeEach(() => { vi.unstubAllEnvs() })

  it('passes host roles through untouched until the key is first used', async () => {
    const { devRole } = await load('development')
    expect(devRole(undefined)).toBeUndefined()
    expect(devRole('unknown')).toBe('unknown')
  })

  it('tags untagged audio ME while right Option is held and THEM after release', async () => {
    const { devRole } = await load('development')
    key('keydown')
    expect(devRole('unknown')).toBe('self')
    expect(devRole(undefined)).toBe('self')
    key('keyup')
    expect(devRole('unknown')).toBe('other')
  })

  it('never overrides a real tag from the glasses', async () => {
    const { devRole } = await load('development')
    key('keydown')
    expect(devRole('other')).toBe('other')
    key('keyup')
    expect(devRole('self')).toBe('self')
  })

  it('ignores Space, which the simulator uses to click its focused control', async () => {
    const { devRole } = await load('development')
    key('keydown', 'Space')
    expect(devRole('unknown')).toBe('unknown')
  })

  it('latches on Up = ME and Down = THEM, and survives window blur', async () => {
    const { devRole, devSwipeSpeaker } = await load('development')
    devSwipeSpeaker('up')
    devSwipeSpeaker('up') // key auto-repeat
    window.dispatchEvent(new Event('blur'))
    expect(devRole('unknown')).toBe('self')
    devSwipeSpeaker('down')
    expect(devRole('unknown')).toBe('other')
  })

  it('arms on a first Down so THEM can be tagged before ME ever speaks', async () => {
    const { devRole, devSwipeSpeaker } = await load('development')
    devSwipeSpeaker('down')
    expect(devRole('unknown')).toBe('other')
  })

  it('does nothing outside the dev server', async () => {
    const { devRole } = await load('production')
    key('keydown')
    expect(devRole('unknown')).toBe('unknown')
    expect(document.querySelector('button')).toBeNull()
  })
})
