import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method, not a substring:
 * Vite serves the module `src/api/notes.ts` from a URL containing "/api/notes".
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

test.describe("BUG-04 double submit of a note", () => {
  test("stores one note when Save note is double-clicked", async ({ page }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);

    // Holds every `POST /api/notes` until the test releases it, so the save is
    // deterministically in flight while the second click happens.
    const heldPosts: Request[] = [];
    let releaseHeldPosts: () => void = () => undefined;
    const released = new Promise<void>((resolve) => {
      releaseHeldPosts = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        heldPosts.push(route.request());
        await released;
        await route.continue();
      },
    );

    const submitButton = page.getByTestId("note-submit");
    await page.getByTestId("note-input").fill(noteText);
    await submitButton.dblclick();

    await expect(submitButton).toBeDisabled();
    await expect.poll(() => heldPosts.length).toBe(1);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    releaseHeldPosts();
    const createdNote = (await (await createResponse).json()) as {
      id: number;
      text: string;
    };

    expect(heldPosts).toHaveLength(1);
    expect(createdNote.text).toBe(noteText);
    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-list-item-" + createdNote.id)).toHaveCount(1);
    // Edge case: the guard is released once the save completes.
    await expect(submitButton).toBeEnabled();

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });
});
