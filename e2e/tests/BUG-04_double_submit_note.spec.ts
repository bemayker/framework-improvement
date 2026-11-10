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
 * A substring check on "/api/notes" would also match the Vite module
 * `src/api/notes.ts`, so the pathname is compared for equality.
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

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note sends one POST and shows the note once, before and after reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const matchingItems = page
      .getByTestId("note-list")
      .getByRole("listitem")
      .filter({ hasText: noteText });
    await expect(matchingItems).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(matchingItems).toHaveCount(1);
  });

  test("Save note is disabled while a delayed save is in flight and enabled after it finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("held save");
    await openLandingPage(page);

    let releaseHeldRequest: () => void = () => undefined;
    const requestHeld = new Promise<void>((resolve) => {
      releaseHeldRequest = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        await requestHeld;
        await route.continue();
      },
    );

    const submitButton = page.getByTestId("note-submit");
    await expect(submitButton).toBeEnabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await submitButton.click();

    await expect(submitButton).toBeDisabled();

    releaseHeldRequest();
    await createResponse;

    await expect(submitButton).toBeEnabled();
    await expect(
      page
        .getByTestId("note-list")
        .getByRole("listitem")
        .filter({ hasText: noteText }),
    ).toHaveCount(1);
  });
});
