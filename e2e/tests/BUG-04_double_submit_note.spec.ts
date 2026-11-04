import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request, type Route } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call. The
 * pathname is compared and the host is ignored, because the API lives on a
 * different origin than the page.
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

/**
 * Holds every `POST /api/notes` response until `release()` is called, then lets
 * the real request through. The hold is released by the test once both clicks
 * have been dispatched, never after a fixed sleep.
 */
async function holdCreateResponses(page: Page): Promise<{
  release: () => void;
  createRequests: Request[];
}> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route: Route) => {
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

/** Counts the list items whose text is exactly `text`. */
function noteItemsWithText(page: Page, text: string) {
  return page
    .getByTestId("note-list")
    .locator('[data-testid^="note-list-item-"]')
    .filter({ hasText: new RegExp(`^${text}$`) });
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("a double click while the save is pending sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateResponses(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // Both clicks are dispatched; only now does the held save finish.
    release();
    const created = (await (await createResponse).json()) as CreatedNote;
    expect(created.text).toBe(noteText);

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("a second, different note saves normally after the first save has finished", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateResponses(page);
    release();

    for (const text of [firstText, secondText]) {
      const createResponse = page.waitForResponse(
        (response) =>
          isNotesApiRequest(response.request(), "POST") &&
          response.status() === 201,
      );
      await page.getByTestId("note-input").fill(text);
      await page.getByTestId("note-submit").click();
      await createResponse;
      await expect(noteItemsWithText(page, text)).toHaveCount(1);
      await expect(page.getByTestId("note-submit")).toBeEnabled();
    }

    expect(createRequests).toHaveLength(2);
    await expect(noteItemsWithText(page, firstText)).toHaveCount(1);
    await expect(noteItemsWithText(page, secondText)).toHaveCount(1);
  });
});
