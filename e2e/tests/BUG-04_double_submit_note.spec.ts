import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method, because Vite
 * serves the frontend module `src/api/notes.ts` from a URL that contains the
 * same substring.
 */
function isNotesApiRequest(request: Request, method: "GET" | "POST"): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === NOTES_PATH
  );
}

/** Unique per test, so specs stay independent and parallel-safe. */
function uniqueNoteText(label: string): string {
  return `BUG-04 ${label} ${randomUUID().slice(0, 8)}`;
}

/** Opens the landing page and waits for the mount `GET /api/notes` to settle. */
async function openLandingPage(page: Page): Promise<void> {
  const mountLoad = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

/**
 * Holds every `POST /api/notes` at the network layer until `release` is called,
 * so the first save stays in progress while the test submits again. It waits on
 * a promise the test resolves, never on a fixed timeout.
 */
async function holdCreateRequests(page: Page): Promise<{
  createRequests: Request[];
  release: () => void;
}> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      const request = route.request();
      if (!isNotesApiRequest(request, "POST")) {
        await route.fallback();
        return;
      }
      createRequests.push(request);
      await released;
      await route.continue();
    },
  );

  return { createRequests, release };
}

test.describe("BUG-04 double submit note", () => {
  test("stores a note once when Save note is clicked twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The first save is still held, so the form must already refuse a second one.
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    release();

    const savedItem = page
      .getByTestId("note-list")
      .getByText(noteText, { exact: true });
    await expect(savedItem).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    // The backend stored it once as well, not only the list on screen.
    await page.reload();
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("sends only one create request when the form is submitted twice before the first save completes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await expect.poll(() => createRequests.length).toBe(1);
    await input.press("Enter");
    release();

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);
  });
});
