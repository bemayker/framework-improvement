import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
// Long enough that the second click of a double click always lands while the
// first save is still in flight.
const SAVE_LATENCY_MS = 750;

/** Matches the backend notes call on its exact path and method (see TEST-03). */
function isNotesApiRequest(request: Request, method: "GET" | "POST"): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === NOTES_PATH
  );
}

/** Unique per test, so specs stay independent and parallel-safe. */
function uniqueNoteText(label: string): string {
  return `BUG-04 ${label} ${randomUUID().slice(0, 8)}`;
}

/** Holds every `POST /api/notes` for `SAVE_LATENCY_MS` before it reaches the backend. */
async function delaySaves(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, SAVE_LATENCY_MS));
      }
      await route.continue();
    },
  );
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

/** Types `text`, double-clicks "Save note" and waits for the first save to finish. */
async function doubleClickSave(page: Page, text: string): Promise<Request[]> {
  const createRequests: Request[] = [];
  page.on("request", (request) => {
    if (isNotesApiRequest(request, "POST")) {
      createRequests.push(request);
    }
  });

  const firstSave = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );

  await page.getByTestId("note-input").fill(text);
  await page.getByTestId("note-submit").dblclick();

  await firstSave;
  await expect(page.getByTestId("note-input")).toHaveValue("");
  return createRequests;
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a double-clicked note once", async ({ page }) => {
    const noteText = uniqueNoteText("stores once");
    await delaySaves(page);
    await openLandingPage(page);

    await doubleClickSave(page, noteText);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("sends one save request when the form is submitted twice before the first save finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("one request");
    await delaySaves(page);
    await openLandingPage(page);

    const createRequests = await doubleClickSave(page, noteText);

    expect(createRequests).toHaveLength(1);
  });
});
