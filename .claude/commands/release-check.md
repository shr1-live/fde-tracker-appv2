---
description: Is the latest web change live? Compare main, the Vercel build and the API address
---
1. `git fetch`, then say whether the current branch is merged into `origin/main`.
2. Fetch https://fde-tracker-green.vercel.app/ and name the JS bundle it serves; check that bundle contains the API address from `.env.production`.
3. Call `<API>/health` and report the status and the time it took (the free server sleeps when idle).
4. Report: merged yes/no, live yes/no, API up yes/no. If something is missing, say which step and what to do. Never merge or push without being asked.
