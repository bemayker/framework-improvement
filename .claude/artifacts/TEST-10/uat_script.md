# UAT Script, TEST-10: Footer shows the build commit

## Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root, start the stack with a known commit: `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
3. Read the footer → it reads `Task Notes v0.1.0 (a1b2c3d)`: the version, a space, then the first 7 characters of the commit in parentheses.
4. Right-click the footer and choose Inspect → inside `<footer data-testid="app-footer">` there is a `<span data-testid="app-footer-commit">` whose text is `(a1b2c3d)`, after the `app-footer-version` span reading `v0.1.0`.
5. Recreate the backend without a commit: `BUILD_COMMIT= docker compose up -d backend`, wait until http://localhost:8010/api/version shows `"commit":"unknown"`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

## Criterion 2: While the request is pending or when it fails, the footer shows the version alone
Prerequisites: the stack from Criterion 1 running with the known commit; Chrome DevTools open.
1. In DevTools open the Network request blocking panel (Command menu, "Show Request blocking"), add the pattern `*/api/version` and enable it → the pattern is listed and checked.
2. Reload http://localhost:5183/ → the Network tab shows the `/api/version` request blocked, and the footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no error text.
3. Remove the blocking pattern, then run `docker compose stop backend` and reload http://localhost:5183/ → the footer again reads exactly `Task Notes`.
4. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, and reload → the footer reads `Task Notes v0.1.0 (a1b2c3d)` again.
5. For the pending state itself, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → 0 failed, including the test that renders the footer with a request that never settles and expects exactly `Task Notes`.

## Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root → the run reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → one test resolves the client with version `0.1.0` and commit `a1b2c3d4e5f6` and expects `Task Notes v0.1.0 (a1b2c3d)`; one returns a never-settling promise and expects exactly `Task Notes`; one rejects and expects exactly `Task Notes`; one resolves commit `null` and expects exactly `Task Notes v0.1.0`.
