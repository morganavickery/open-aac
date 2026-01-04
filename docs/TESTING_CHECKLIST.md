# Accessibility & Testing Checklist — Open AAC

Use this checklist when performing manual accessibility testing and reporting issues.

## Basic environment info

* Date:
* App version / commit:
* Device & model:
* OS & version:
* Browser & version:
* Assistive tech used (VoiceOver, NVDA, Switch, etc.):


---

## Keyboard navigation

- [ ] Can navigate all interactive elements with Tab / Shift+Tab.
- [ ] Focus order is logical.
- [ ] Focus ring is visible on focused elements.
- [ ] All controls are operable via keyboard (Enter/Space to activate).

## Screen reader (VoiceOver / NVDA)

- [ ] Page has a meaningful document title
- [ ] Board cells expose accessible names (aria-label or visible text)
- [ ] Buttons announce purpose and state (e.g., "Play, help button")
- [ ] Modal dialogs (if any) trap focus while open

## Touch / tablet checks (iPad)

- [ ] Buttons are large enough (>= 44x44 CSS px)
- [ ] Spacing prevents accidental presses
- [ ] Add-to-Home-Screen install: verify app loads offline

## Color & contrast

- [ ] Text meets WCAG AA contrast vs background
- [ ] Interactive states (hover, focus, active) are distinguishable

## TTS & audio

- [ ] Play buttons trigger TTS
- [ ] TTS rate/pitch settings are functional
- [ ] Recorded voice clips (if any) play back correctly

## Performance & responsiveness

- [ ] App loads in reasonable time on tablet devices
- [ ] Interface remains responsive under slow network (use throttling)

## Export / Import

- [ ] Exported board JSON downloads and can be re-imported
- [ ] Import handles unexpected JSON gracefully (error message)

## Other checks

- [ ] No unexpected network calls (privacy)
- [ ] No console errors during typical use

## Reporting

When filing an issue, include:

* Steps to reproduce
* Expected vs actual behavior
* Screenshots or short video (avoid personal info)
* Which checklist items failed (copy-paste relevant lines)


