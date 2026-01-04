# Contributing to Open AAC

Thanks for helping build **Open AAC** — an open, free, and accessible AAC PWA. We welcome contributors of all backgrounds, especially people with lived AAC experience, caregivers, therapists, and accessibility experts. This document explains how to propose changes, report bugs, and participate in co-design.

## Our values

* **Accessibility first** — prioritize users who rely on assistive tech.
* **Presume competence** — design for full expression at all ages.
* **Privacy & ownership** — users must own their data and voice.
* **Open & inclusive** — welcome contributions from everyone.

## Getting started (quick)


1. Fork the repo and clone locally:

   ```bash
   git clone https://github.com/morganavickery/open-aac.git
   cd open-aac
   npm install
   npm run dev
   ```
2. Create a branch for your work:

   `git checkout -b feat/short-description`
3. Make changes, run tests/lint (if present), and open a pull request.

## How to report bugs

Please use the provided **Bug Report** issue template (click *New issue* → *Bug report*). Include device, browser, and accessibility tools used (e.g., VoiceOver, NVDA), and steps to reproduce. If you’re an AAC user, tell us how the issue affects you.

## How to request features

Use the **Feature Request** template. Be concrete: describe the problem, suggested UX, and why it helps users.

## Code style

* TypeScript + React (Vite)
* Use `prettier` formatting and run the linter before committing (we recommend setting up `husky` + `lint-staged`).
* Keep components small and accessible (semantic HTML + ARIA).

## Accessibility & testing

If your change affects UI or interaction, do at least the following:


1. Keyboard-only navigation (Tab order, focus visible).
2. Screen reader check (VoiceOver on macOS/iOS, NVDA on Windows).
3. Large touch targets and high-contrast checks.
4. If possible, test on an iPad via Safari and try Add-to-Home-Screen.

Document what you tested in the PR description (devices, browsers, assistive tech).

## Design / Content contributions (boards & assets)

* Boards should be exportable/importable as JSON.
* Avoid bundling proprietary symbol sets without a compatible license.
* If proposing symbol assets, include license and attribution information.

## Co-design & user testing

We actively seek AAC users for co-design sessions. If you want to partner in user testing, add a comment to the issue `co-design: user-testing` or email the maintainer (see `README` contact).

## Security & privacy

* Do NOT post user data (screenshots with personal info) in issues.
* To disclose a security/privacy issue, see `SECURITY.md` (or email the project maintainer).


