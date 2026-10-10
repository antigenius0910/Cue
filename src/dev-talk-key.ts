// Dev-only stand-in for the glasses' speaker tags. The desktop simulator
// streams microphone audio but cannot say who is talking, so ME/THEM
// labelling has nothing to go on there. Under the Vite dev server, holding
// the right Option key (or the on-page button) marks audio as the wearer's;
// releasing it marks audio as the other person's.
//
// Right Option rather than Space: Space activates whichever button has
// focus, and in the simulator that is usually its "click" control, which
// toggles the mic. A lone modifier key activates nothing and types nothing.
// Key events only reach this page while it has focus, so click the page
// once after using the simulator's own controls.
//
// It stays out of the way until first used: before the first press, frames
// keep whatever role the host gave them, so a phone with real glasses is
// unaffected. Real 'self'/'other' tags always win over the key.

import { devLog } from './dev-log'

const TALK_KEY = 'AltRight'

let armed = false
let held = false
let indicatorEl: HTMLElement | null = null

export function devRole(role: string | undefined): string | undefined {
  if (!armed || role === 'self' || role === 'other') return role
  return held ? 'self' : 'other'
}

function setHeld(next: boolean, indicator: HTMLElement | null, via: string): void {
  armed = true
  held = next
  if (via !== 'swipe') latched = false
  devLog('talk-key', { speaker: held ? 'ME' : 'THEM', via })
  if (!indicator) return
  indicator.textContent = held ? 'now tagging: ME' : 'now tagging: THEM'
  indicator.style.background = held ? '#fef991' : '#eee'
}

// The simulator's Up / Down controls as a speaker switch: Up = ME is
// talking, Down = THEM. It latches until the other one is pressed. An
// earlier version treated a held, auto-repeating Up as ME and fell back to
// THEM on a timer, but the timer's lag mislabelled the words right after
// each handover; an explicit press on each side has no lag. Unlike the
// keyboard listeners below, this goes through the simulator's own controls,
// so it works whichever part of the window has focus.
let latched = false

export function devSwipeSpeaker(dir: 'up' | 'down'): void {
  if (import.meta.env.MODE !== 'development') return
  const me = dir === 'up'
  latched = true
  // A held key auto-repeats; only a change of speaker is worth acting on.
  if (armed && held === me) return
  setHeld(me, indicatorEl, 'swipe')
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}

export function installDevTalkKey(mount: HTMLElement): void {
  if (import.meta.env.MODE !== 'development') return

  const box = document.createElement('div')
  box.style.cssText = 'margin: 0 0 1rem 0; padding: .5rem .75rem; border: 1px dashed #999; border-radius: 4px; font-size: .9em;'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Hold = ME (or in the simulator: Up = ME, Down = THEM)'
  button.style.cssText = 'padding: .5rem .75rem; cursor: pointer; margin-right: .5rem;'
  const indicator = document.createElement('span')
  indicator.textContent = 'dev speaker key: not used yet — click this page first'
  indicator.style.cssText = 'padding: .2rem .5rem; border-radius: 4px;'
  box.append(button, indicator)
  indicatorEl = indicator
  mount.insertAdjacentElement('afterend', box)

  button.addEventListener('pointerdown', () => setHeld(true, indicator, 'button'))
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
    button.addEventListener(ev, () => { if (held) setHeld(false, indicator, 'button') })
  }
  window.addEventListener('keydown', e => {
    if (e.code !== TALK_KEY || isTyping(e.target)) return
    if (!e.repeat) setHeld(true, indicator, 'key')
  })
  window.addEventListener('keyup', e => {
    if (e.code !== TALK_KEY || isTyping(e.target)) return
    setHeld(false, indicator, 'key')
  })
  // Losing focus mid-hold would otherwise leave the key stuck on ME. A
  // latched Up is exempt: the tester clicks other windows all the time.
  window.addEventListener('blur', () => { if (held && !latched) setHeld(false, indicator, 'blur') })
}
