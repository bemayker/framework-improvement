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
}

/**
 * Holds every `POST /api/notes` until `release()` is called, so the save stays
 * in progress for as long as the test needs, with no fixed wait. Returns the
 * POST requests seen so far (a live array) and the release function.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ createRequests: Request[]; release: () => void }> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (!isNotesApiRequest(route.request(), "POST")) {
        await route.fallback();
        return;
      }
      createRequests.push(route.request());
      await released;
      await route.fallback();
    },
  );

  return { createRequests, release };
}

/** Waits for the 201 of the held POST, to be started before releasing it. */
function waitForCreated(page: Page) {
  return page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when Save note is clicked twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const created = waitForCreated(page);
    release();
    await created;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
  });

  test("pressing Enter again while saving does not store the note twice", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");

    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const created = waitForCreated(page);
    release();
    await created;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
  });
});
