import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method; a substring
 * check would also catch Vite's `src/api/notes.ts` module fetch.
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

test.describe("BUG-04 double submit note", () => {
  test("stores a note once when Save note is double-clicked", async ({ page }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    // Hold the real POST until both clicks have been dispatched, so the first
    // save is still in flight when the second click lands; then pass it
    // through to the real backend.
    let releasePost: () => void = () => {};
    const postMayProceed = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() === "POST") {
          await postMayProceed;
        }
        await route.continue();
      },
    );

    await page.getByTestId("note-input").fill(noteText);
    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-submit").dblclick();
    releasePost();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const matchingItems = page
      .getByTestId("note-list")
      .getByText(noteText, { exact: true });
    await expect(matchingItems).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);

    await page.unroute((url) => url.pathname === NOTES_PATH);
    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("saves a second distinct note after the first save completes", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);

    for (const text of [firstText, secondText]) {
      const createResponse = page.waitForResponse(
        (response) =>
          isNotesApiRequest(response.request(), "POST") &&
          response.status() === 201,
      );
      await page.getByTestId("note-input").fill(text);
      await page.getByTestId("note-submit").click();
      await createResponse;
      await expect(
        page.getByTestId("note-list").getByText(text, { exact: true }),
      ).toHaveCount(1);
      await expect(page.getByTestId("note-submit")).toBeEnabled();
    }
  });
});
