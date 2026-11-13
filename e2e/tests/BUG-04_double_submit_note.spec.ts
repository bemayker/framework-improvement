import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring.
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
  /** Every `POST /api/notes` that reached the network layer. */
  createRequests: Request[];
  /** Lets the held save continue to the backend. */
  release: () => void;
};

/**
 * Holds every `POST /api/notes` open until `release` is called, so the first
 * save is provably still in flight while the test submits again. `GET` passes
 * straight through.
 */
async function holdCreateRequests(page: Page): Promise<HeldSave> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route("**/api/notes", async (route) => {
    const request = route.request();
    if (!isNotesApiRequest(request, "POST")) {
      await route.continue();
      return;
    }
    createRequests.push(request);
    await released;
    await route.continue();
  });

  return { createRequests, release };
}

/** Asserts the note is listed exactly once and the form is usable again. */
async function expectStoredOnce(
  page: Page,
  noteText: string,
  held: HeldSave,
): Promise<void> {
  await expect(
    page.getByTestId("note-list").getByText(noteText, { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByTestId("note-input")).toHaveValue("");
  await expect(page.getByTestId("note-submit")).toBeEnabled();
  expect(held.createRequests).toHaveLength(1);
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when Enter is pressed twice before the save finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await input.press("Enter");

    held.release();

    await expectStoredOnce(page, noteText, held);
  });

  test("stores a note once when Save note is double-clicked", async ({ page }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    held.release();

    await expectStoredOnce(page, noteText, held);
  });

  test("sends a single save request when the note is submitted twice before the first save finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("same-tick");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    // Two submit events in one tick: both read the state from before the first
    // re-render, so only the in-flight guard can stop the second.
    await page.getByTestId("note-form").evaluate((form) => {
      const noteForm = form as HTMLFormElement;
      noteForm.requestSubmit();
      noteForm.requestSubmit();
    });

    held.release();

    await expectStoredOnce(page, noteText, held);
  });
});
