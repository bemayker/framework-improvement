import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check would also catch Vite's `src/api/notes.ts` module fetch).
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

/** Collects every `POST /api/notes` the page issues from now on. */
function recordCreateRequests(page: Page): Request[] {
  const createRequests: Request[] = [];

  page.on("request", (request) => {
    if (isNotesApiRequest(request, "POST")) {
      createRequests.push(request);
    }
  });

  return createRequests;
}

/**
 * Holds the first `POST /api/notes` at the network layer until `release()` is
 * called, so the save stays in flight while the test submits again. Every other
 * request, and any later POST, goes through immediately. The hold is released
 * explicitly by the test, never by a timeout.
 */
async function holdFirstCreateRequest(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstCreateSeen = false;

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST" && !firstCreateSeen) {
        firstCreateSeen = true;
        await gate;
      }
      await route.continue();
    },
  );

  return release;
}

function waitForCreated(page: Page) {
  return page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("a double click on Save note sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const release = await holdFirstCreateRequest(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const created = waitForCreated(page);
    release();
    await created;

    const noteItems = page.getByTestId("note-list").getByText(noteText);
    await expect(noteItems).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });

  test("a click followed by Enter in the field sends one POST and shows one list item", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click-enter");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const release = await holdFirstCreateRequest(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await page.getByTestId("note-submit").click();
    await input.press("Enter");

    const created = waitForCreated(page);
    release();
    await created;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
  });

  test("a deliberate later save of the same text is stored as a second note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("repeat");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    for (const expectedCount of [1, 2]) {
      const created = waitForCreated(page);
      await page.getByTestId("note-input").fill(noteText);
      await page.getByTestId("note-submit").click();
      await created;

      await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(
        expectedCount,
      );
    }

    expect(createRequests).toHaveLength(2);
  });
});
