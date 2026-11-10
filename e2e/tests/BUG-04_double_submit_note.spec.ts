import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call.
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
 * a test never interacts with a list that is still loading.
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

type HeldCreate = {
  /** Every `POST /api/notes` that reached the network layer, held or not. */
  createRequests: Request[];
  /** Lets every held create request through to the backend. */
  release: () => void;
};

/**
 * Holds each `POST /api/notes` open until `release` is called, so the in-flight
 * window the bug lives in stays open for as long as the test needs it. The test
 * releases it explicitly: no fixed waits.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreate> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (!isNotesApiRequest(route.request(), "POST")) {
        await route.continue();
        return;
      }
      createRequests.push(route.request());
      await released;
      await route.continue();
    },
  );

  return { createRequests, release };
}

/** Counts the list items showing exactly `text`. */
function noteItemsWithText(page: Page, text: string) {
  return page
    .locator('[data-testid^="note-list-item-"]')
    .filter({ hasText: text });
}

test.describe("BUG-04 saving a note twice quickly", () => {
  test("a double click on Save sends one create request and stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    // Both clicks land while the first create request is still held open.
    await page.getByTestId("note-submit").dblclick();
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await createResponse;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(held.createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("pressing Enter twice in the field sends one create request and stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter twice");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await createResponse;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
    expect(held.createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
  });
});
