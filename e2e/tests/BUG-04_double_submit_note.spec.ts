import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
const NOTE_ITEM_TESTID = /^note-list-item-/;

/**
 * Matches the backend notes call on its exact path and method. A substring
 * check on "/api/notes" would also catch Vite's `src/api/notes.ts` module fetch.
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
 * Holds every `POST /api/notes` at the browser until `release()` is called, then
 * forwards it to the real backend. Keeping the first save in flight makes the
 * double submit deterministic: the second submit always happens while the first
 * request is pending, with no fixed wait.
 */
async function holdCreateRequests(page: Page): Promise<{
  release: () => void;
  requests: Request[];
}> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: Request[] = [];

  page.on("request", (request) => {
    if (isNotesApiRequest(request, "POST")) {
      requests.push(request);
    }
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await released;
      await route.continue();
    },
  );

  return { release, requests };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note stores the note once, also after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    const saved = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-submit").dblclick();

    // The first save is still held, so the guard is what must be keeping the form closed.
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    held.release();
    await saved;

    const items = page.getByTestId(NOTE_ITEM_TESTID).filter({ hasText: noteText });
    await expect(items).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(held.requests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId(NOTE_ITEM_TESTID).filter({ hasText: noteText }),
    ).toHaveCount(1);
  });

  test("pressing Enter twice in the field while a save is pending sends one request", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter twice");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    const saved = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await input.press("Enter");
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await input.press("Enter");

    held.release();
    await saved;

    await expect(
      page.getByTestId(NOTE_ITEM_TESTID).filter({ hasText: noteText }),
    ).toHaveCount(1);
    expect(held.requests).toHaveLength(1);
  });
});
