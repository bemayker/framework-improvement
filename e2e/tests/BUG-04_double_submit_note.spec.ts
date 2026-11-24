import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method, because Vite
 * serves the module `src/api/notes.ts` from a URL that also contains "/api/notes".
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

/** Opens the landing page once the mount `GET /api/notes` has settled. */
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
 * Holds every `POST /api/notes` open until `release()` is called, so the first
 * save is still pending while the second submit arrives. `postCount()` is the
 * number of create requests the browser actually sent.
 */
async function holdCreateRequests(page: Page): Promise<{
  release: () => void;
  postCount: () => number;
}> {
  let releaseGate: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    releaseGate = resolve;
  });
  let sentPosts = 0;

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      sentPosts += 1;
      await gate;
      await route.continue();
    },
  );

  return { release: releaseGate, postCount: () => sentPosts };
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when Save note is clicked twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    // One dblclick, not two click() calls: the second click() would wait for an
    // enabled button, which stays disabled while the held request is pending.
    await page.getByTestId("note-submit").dblclick();

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    held.release();

    const savedItems = page.getByTestId("note-list").getByText(noteText, { exact: true });
    await expect(savedItems).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(held.postCount()).toBe(1);

    await page.reload();
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("stores a note once when Enter is pressed twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double enter");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    const noteInput = page.getByTestId("note-input");
    await noteInput.fill(noteText);
    await noteInput.press("Enter");
    await noteInput.press("Enter");

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    held.release();

    const savedItems = page.getByTestId("note-list").getByText(noteText, { exact: true });
    await expect(savedItems).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(held.postCount()).toBe(1);

    await page.reload();
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });
});
