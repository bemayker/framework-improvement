import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" would also catch Vite's module fetch of
 * `src/api/notes.ts`, so the pathname is compared exactly.
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
 * Holds every `POST /api/notes` at the browser until `release()` is called,
 * which keeps the first save in flight while the test issues a second submit.
 * Returns the POSTs that reached the route and the release function.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ heldPosts: Request[]; release: () => void }> {
  const heldPosts: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        heldPosts.push(route.request());
        await released;
      }
      await route.continue();
    },
  );

  return { heldPosts, release };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a click followed by Enter while the save is in flight sends one POST and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click-enter");
    await openLandingPage(page);
    const { heldPosts, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    // The field still holds the text, so Enter submits the form a second time.
    await page.getByTestId("note-input").press("Enter");

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await createResponse;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(heldPosts).toHaveLength(1);
  });

  test("a double-click on Save note sends one POST and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const { heldPosts, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await createResponse;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    expect(heldPosts).toHaveLength(1);
  });
});
