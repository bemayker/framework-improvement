import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type HeldCreates = {
  /** Number of `POST /api/notes` requests the page has sent so far. */
  sentCount: () => number;
  /** Lets every held (and future) POST through to the real backend. */
  release: () => void;
};

/**
 * Matches the backend notes call on its exact path and method, so the Vite
 * module `src/api/notes.ts` (same substring) is never mistaken for the API.
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

/**
 * Opens the landing page and waits for the mount `GET /api/notes` to settle, so
 * a late mount response never replaces a note added first.
 */
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
 * which keeps the first save in flight while the second submit is fired. A
 * promise gate stands in for a fixed wait: nothing here depends on timing.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreates> {
  let sent = 0;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      sent += 1;
      await gate;
      await route.continue();
    },
  );

  return { sentCount: () => sent, release };
}

/**
 * Releases the held save, waits for the note to reach the list, then asserts
 * exactly one request was sent and one entry exists, also after a reload.
 */
async function expectStoredOnce(
  page: Page,
  held: HeldCreates,
  noteText: string,
): Promise<void> {
  const createResponse = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );
  held.release();
  await createResponse;

  const entries = page.getByTestId("note-list").getByText(noteText, { exact: true });
  await expect(entries).toHaveCount(1);
  await expect(page.getByTestId("note-submit")).toBeEnabled();
  expect(held.sentCount()).toBe(1);

  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;

  await expect(entries).toHaveCount(1);
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when Save note is double-clicked", async ({ page }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await expectStoredOnce(page, held, noteText);
  });

  test("sends one save request when the form is submitted twice before the first save finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await expectStoredOnce(page, held, noteText);
  });

  test("sends one save request when Save note is clicked twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("two clicks");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    const submit = page.getByTestId("note-submit");
    await submit.click();
    // Forced: once the first save is in flight the button is disabled, and the
    // second click must still be dispatched at it rather than waited on.
    await submit.click({ force: true });

    await expect(submit).toBeDisabled();
    await expectStoredOnce(page, held, noteText);
  });
});
