import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method, because Vite
 * serves the module `src/api/notes.ts` from a URL that contains the same
 * substring.
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

/** Opens the landing page and waits for the mount list load to settle. */
async function openLandingPage(page: Page): Promise<void> {
  const mountLoad = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

/** A promise the test resolves by hand, to release a held request. */
function createGate(): { opened: Promise<void>; open: () => void } {
  let open!: () => void;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { opened, open };
}

test.describe("BUG-04 double submit of a note", () => {
  test("sends one save request when Save note is clicked twice while the first save is pending", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("one request");
    const releaseSave = createGate();
    const heldRequests: Request[] = [];

    await openLandingPage(page);
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }
        heldRequests.push(route.request());
        await releaseSave.opened;
        await route.continue();
      },
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await expect.poll(() => heldRequests.length).toBe(1);
    // The second click has been dispatched by now; the count must stay at one.
    expect(heldRequests).toHaveLength(1);

    const created = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    releaseSave.open();
    await created;

    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(heldRequests).toHaveLength(1);
  });

  test("stores a note once when Save note is double-clicked during a pending save", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("stores once");
    const releaseSave = createGate();
    let heldCount = 0;

    await openLandingPage(page);
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }
        heldCount += 1;
        await releaseSave.opened;
        await route.continue();
      },
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    await expect.poll(() => heldCount).toBe(1);

    releaseSave.open();

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
  });

  test("stores a single note when a failed save is retried", async ({ page }) => {
    const noteText = uniqueNoteText("retry");
    const releaseFirstSave = createGate();
    let postCount = 0;

    await openLandingPage(page);
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }
        postCount += 1;
        if (postCount === 1) {
          await releaseFirstSave.opened;
          await route.fulfill({ status: 500, body: "boom" });
          return;
        }
        await route.continue();
      },
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await expect.poll(() => postCount).toBe(1);
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    releaseFirstSave.open();

    await expect(page.getByTestId("note-form-error")).toBeVisible();
    await expect(page.getByTestId("note-input")).toHaveValue(noteText);
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    await page.getByTestId("note-submit").click();

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
    expect(postCount).toBe(2);
  });
});
