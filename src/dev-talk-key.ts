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
  devLog('talk-key', { speaker: held ? 'ME' : 'THEM', via })
  if (!indicator) return
  indicator.textContent = held ? 'now tagging: ME' : 'now tagging: THEM'
  indicator.style.background = held ? '#fef991' : '#eee'
}

// Holding the simulator's Up control = ME is talking; not pressing = THEM.
// The glasses touchpad has no "held" state, only discrete swipe events, but
// a held Up key auto-repeats, so ME lasts for as long as Up events keep
// arriving and falls back to THEM shortly after they stop. The grace period
// has to outlast the OS's delay before the first repeat. Down ends ME at
// once. Unlike the keyboard listeners below, this goes through the
// simulator's own controls, so it works whichever part of the window has
// focus.
const SWIPE_HOLD_GRACE_MS = 1200
let swipeTimer: number | null = null

export function devSwipeSpeaker(dir: 'up' | 'down'): void {
  if (import.meta.env.MODE !== 'development') return
  if (swipeTimer !== null) window.clearTimeout(swipeTimer)
  swipeTimer = null
  if (dir === 'down') {
    if (held || !armed) setHeld(false, indicatorEl, 'swipe')
    return
  }
  if (!held) setHeld(true, indicatorEl, 'swipe')
  swipeTimer = window.setTimeout(() => {
    swipeTimer = null
    setHeld(false, indicatorEl, 'swipe-release')
  }, SWIPE_HOLD_GRACE_MS)
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
  button.textContent = 'Hold = ME (or hold Up in the simulator; not pressing = THEM)'
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
  // Losing focus mid-hold would otherwise leave the key stuck on ME. An Up
  // hold is exempt: its own timer ends it.
  window.addEventListener('blur', () => { if (held && swipeTimer === null) setHeld(false, indicator, 'blur') })
}
