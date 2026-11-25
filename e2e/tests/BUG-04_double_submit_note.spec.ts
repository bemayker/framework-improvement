import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method (copied from the
 * TEST-03 spec on purpose, specs do not import each other). A substring check
 * would also catch Vite's `src/api/notes.ts` module request.
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

/** Waits for the mount `GET /api/notes`, so the list is settled before any interaction. */
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
 * Holds the first `POST /api/notes` at the network layer until `release()`.
 *
 * The hold keeps the save pending while the second click or Enter is fired, so
 * the double submit is deterministic instead of depending on how fast the
 * backend answers. Any further POST is passed straight through, so a second
 * request (the defect) is sent and recorded rather than blocked.
 */
async function holdFirstCreateRequest(page: Page): Promise<{
  firstRequestHeld: Promise<void>;
  release: () => void;
}> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markHeld: () => void = () => undefined;
  const firstRequestHeld = new Promise<void>((resolve) => {
    markHeld = resolve;
  });
  let firstSeen = false;

  await page.route(`**${NOTES_PATH}`, async (route) => {
    if (route.request().method() === "POST" && !firstSeen) {
      firstSeen = true;
      markHeld();
      await released;
    }
    await route.continue();
  });

  return { firstRequestHeld, release };
}

/**
 * Runs one double submit end to end and asserts the outcome.
 *
 * The POST count is read only after the held request is released and the list
 * has settled (note listed, field cleared, button usable again), so a late
 * second POST is not missed.
 */
async function expectDoubleSubmitStoresOnce(
  page: Page,
  noteText: string,
  doubleSubmit: () => Promise<void>,
): Promise<void> {
  await openLandingPage(page);
  const createRequests = recordCreateRequests(page);
  const { firstRequestHeld, release } = await holdFirstCreateRequest(page);

  await page.getByTestId("note-input").fill(noteText);
  await doubleSubmit();
  await firstRequestHeld;

  const createResponse = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "POST") && response.ok(),
  );
  release();
  await createResponse;

  const noteItems = page.getByTestId(/^note-list-item-/).filter({ hasText: noteText });
  await expect(noteItems).toHaveCount(1);
  await expect(page.getByTestId("note-input")).toHaveValue("");
  await expect(page.getByTestId("note-submit")).toBeEnabled();
  expect(createRequests).toHaveLength(1);

  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;

  await expect(noteItems).toHaveCount(1);
}

test.describe("BUG-04 double submit note", () => {
  test("double-clicking Save note stores the note once", async ({ page }) => {
    await expectDoubleSubmitStoresOnce(page, uniqueNoteText("dblclick"), () =>
      page.getByTestId("note-submit").dblclick(),
    );
  });

  test("sends one create request when Save note is clicked twice while saving", async ({
    page,
  }) => {
    const submit = page.getByTestId("note-submit");

    await expectDoubleSubmitStoresOnce(page, uniqueNoteText("two clicks"), async () => {
      await submit.click();
      // force: skips the enabled check, so the second click reaches the page
      // even once the button is disabled, which is what a fast user does.
      await submit.click({ force: true });
    });
  });

  test("sends one create request when Enter is pressed twice while saving", async ({
    page,
  }) => {
    const input = page.getByTestId("note-input");

    await expectDoubleSubmitStoresOnce(page, uniqueNoteText("enter twice"), async () => {
      await input.press("Enter");
      await input.press("Enter");
    });
  });
});
