import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method, because a
 * substring match would also catch Vite's `src/api/notes.ts` module fetch.
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
  test("stores a note once when Save note is clicked twice before the save returns", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");

    // Holds every POST until the test releases it, so the second click
    // deterministically lands while the first save is still in flight.
    let releaseCreate: () => void = () => undefined;
    const createReleased = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    await page.route(`**${NOTES_PATH}`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await createReleased;
      await route.continue();
    });

    await openLandingPage(page);

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    await page.getByTestId("note-input").fill(noteText);

    const firstCreateSent = page.waitForRequest((request) =>
      isNotesApiRequest(request, "POST"),
    );
    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    const submitButton = page.getByTestId("note-submit");
    await submitButton.click();
    await firstCreateSent;

    // The button is disabled now, so a plain click would wait for it to come
    // back; forcing it is the user's second quick click on the held save.
    await expect(submitButton).toBeDisabled();
    await submitButton.click({ force: true });

    releaseCreate();
    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const savedNoteItem = page.getByTestId(`note-list-item-${createdNote.id}`);
    await expect(savedNoteItem).toHaveText(noteText);
    await expect(submitButton).toBeEnabled();
    expect(createRequests).toHaveLength(1);
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });
});
