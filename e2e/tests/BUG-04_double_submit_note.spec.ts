import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
// How long the save is held in flight, so the second submit reliably lands
// while the first request has not settled yet.
const SAVE_HOLD_MS = 750;

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check also catches Vite's `src/api/notes.ts` module request).
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
 * Holds every `POST /api/notes` for a moment before passing it on to the real
 * backend, so the save is in flight when the second submit arrives. Returns
 * the list of POSTs that reached the network.
 */
async function delaySaves(page: Page): Promise<Request[]> {
  const createRequests: Request[] = [];

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        createRequests.push(route.request());
        await new Promise((resolve) => setTimeout(resolve, SAVE_HOLD_MS));
      }
      await route.continue();
    },
  );

  return createRequests;
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = await delaySaves(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const createdNote = (await (await createResponse).json()) as {
      id: number;
      text: string;
    };
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("a click followed by Enter in the field sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click then enter");
    await openLandingPage(page);
    const createRequests = await delaySaves(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await page.getByTestId("note-submit").click();
    await input.press("Enter");

    const createdNote = (await (await createResponse).json()) as {
      id: number;
      text: string;
    };
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });
});
