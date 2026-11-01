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

/** Waits for the mount `GET /api/notes`, so the list is settled before acting. */
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
 * Holds every `POST /api/notes` until the returned `release` is called, so the
 * second submit lands while the first save has not answered yet.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ release: () => void; createRequests: Request[] }> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      createRequests.push(route.request());
      await released;
      await route.continue();
    },
  );

  return { release, createRequests };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note stores and lists the note once, also after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The save is still pending here: the guard must already hold.
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await createResponse;

    const savedItems = page
      .getByTestId(/^note-list-item-/)
      .filter({ hasText: noteText });
    await expect(savedItems).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(savedItems).toHaveCount(1);
  });

  test("pressing Enter twice in the field sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double enter");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await createResponse;

    await expect(
      page.getByTestId(/^note-list-item-/).filter({ hasText: noteText }),
    ).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
  });
});
