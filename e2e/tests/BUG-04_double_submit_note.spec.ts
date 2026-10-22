import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check would also catch Vite's `src/api/notes.ts` module request).
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

type HeldSave = {
  /** Number of `POST /api/notes` requests that reached the network layer. */
  postCount: () => number;
  /** Resolves once the first POST is being held in flight. */
  firstPostHeld: Promise<void>;
  /** Lets every held POST continue to the real backend. */
  release: () => void;
};

/**
 * Holds every `POST /api/notes` until `release()` is called, so the save stays
 * in flight for as long as the test needs, with no fixed sleep.
 */
async function holdSaveRequests(page: Page): Promise<HeldSave> {
  let postCount = 0;
  let release: () => void = () => undefined;
  let markFirstPostHeld: () => void = () => undefined;

  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const firstPostHeld = new Promise<void>((resolve) => {
    markFirstPostHeld = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      postCount += 1;
      markFirstPostHeld();
      await released;
      await route.continue();
    },
  );

  return { postCount: () => postCount, firstPostHeld, release };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note sends one POST and stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const heldSave = await holdSaveRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    await heldSave.firstPostHeld;

    heldSave.release();
    await createResponse;

    const savedItems = page.getByTestId("note-list").getByText(noteText);
    await expect(savedItems).toHaveCount(1);
    expect(heldSave.postCount()).toBe(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });

  test("the Save note button is disabled while the save is in flight and enabled after", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("disabled");
    await openLandingPage(page);
    const heldSave = await holdSaveRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await heldSave.firstPostHeld;

    await expect(page.getByTestId("note-submit")).toBeDisabled();

    heldSave.release();
    await createResponse;

    await expect(page.getByTestId("note-submit")).toBeEnabled();
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });
});
