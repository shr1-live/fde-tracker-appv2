---
description: Check the web app before a push: types, build, and a look at what changed
---
Run `npx tsc --noEmit` and `npm run build`. Report each as passed or failed with the first error line.
Then run `git diff --stat` and list the screens or components touched. For UI changes, say which of light, dark and phone width were checked and how.
Never claim "works" without the command output. Do not push.
