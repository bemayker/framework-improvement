import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its path and method, whatever origin the
 * frontend resolved its API base URL to. A substring check is not enough: Vite
 * serves `src/api/notes.ts` from a URL containing the same substring.
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
  test("stores a double-clicked note only once", async ({ page }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    // Hold the first POST in flight until both clicks have happened, so the
    // second click lands while the save is still pending (no fixed waits).
    let releaseFirstPost: () => void = () => undefined;
    const firstPostHeld = new Promise<void>((resolve) => {
      releaseFirstPost = resolve;
    });
    let firstPostSeen: () => void = () => undefined;
    const firstPostArrived = new Promise<void>((resolve) => {
      firstPostSeen = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        firstPostSeen();
        await firstPostHeld;
        await route.continue();
      },
    );

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    const submit = page.getByTestId("note-submit");
    await submit.click();
    await firstPostArrived;
    // The fix disables the button while saving, so a force click models the
    // user's second click reaching the form regardless of the disabled state.
    await submit.dblclick({ force: true });
    releaseFirstPost();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const noteItems = page
      .getByTestId("note-list")
      .getByText(noteText, { exact: true });
    await expect(noteItems).toHaveCount(1);
    await expect(submit).toBeEnabled();
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("accepts a second note after the first one has been saved", async ({
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
      const created = (await (await createResponse).json()) as CreatedNote;

      await expect(page.getByTestId(`note-list-item-${created.id}`)).toHaveText(
        text,
      );
      await expect(page.getByTestId("note-submit")).toBeEnabled();
    }
  });
});
