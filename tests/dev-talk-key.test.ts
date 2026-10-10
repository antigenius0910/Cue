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

  it('is ME while Up events keep arriving and THEM shortly after they stop', async () => {
    vi.useFakeTimers()
    try {
      const { devRole, devSwipeSpeaker } = await load('development')
      devSwipeSpeaker('up')
      // A held key repeats: each repeat pushes the release further out.
      for (let i = 0; i < 20; i++) {
        vi.advanceTimersByTime(100)
        devSwipeSpeaker('up')
      }
      window.dispatchEvent(new Event('blur'))
      expect(devRole('unknown')).toBe('self')
      vi.advanceTimersByTime(1100)
      expect(devRole('unknown')).toBe('self')
      vi.advanceTimersByTime(200)
      expect(devRole('unknown')).toBe('other')
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends ME immediately on Down', async () => {
    const { devRole, devSwipeSpeaker } = await load('development')
    devSwipeSpeaker('up')
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
