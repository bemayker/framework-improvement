import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring.
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

/** Opens the landing page and waits for the mount list load to settle. */
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

/** The list entries whose whole text equals `text`. */
function listEntries(page: Page, text: string) {
  return page.getByTestId("note-list").getByText(text, { exact: true });
}

test.describe("BUG-04 double submit note", () => {
  test("stores a double-clicked note only once", async ({ page }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    // The button re-enables once the save settles, so a late second request
    // would already have been sent by the time this passes.
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(listEntries(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listEntries(page, noteText)).toHaveCount(1);
  });

  test("saves a second, different note right after the first one", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    for (const noteText of [firstText, secondText]) {
      const createResponse = page.waitForResponse(
        (response) =>
          isNotesApiRequest(response.request(), "POST") &&
          response.status() === 201,
      );

      await page.getByTestId("note-input").fill(noteText);
      await page.getByTestId("note-submit").click();
      await createResponse;

      await expect(page.getByTestId("note-submit")).toBeEnabled();
      await expect(listEntries(page, noteText)).toHaveCount(1);
    }

    expect(createRequests).toHaveLength(2);
  });
});
