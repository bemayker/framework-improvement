import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check also matches Vite's `src/api/notes.ts` module request).
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
  test("a double click on Save note sends one POST and stores one note, also after reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    // Hold the first POST open so both clicks land while the save is in flight.
    let releaseFirstPost: () => void = () => undefined;
    const firstPostHeld = new Promise<void>((resolve) => {
      releaseFirstPost = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }
        await firstPostHeld;
        await route.continue();
      },
    );

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The visible cue that the save is in flight, and proof both clicks were
    // handled before the response was released.
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    releaseFirstPost();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const noteItems = page.getByTestId(/^note-list-item-/).filter({ hasText: noteText });
    await expect(noteItems).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItems).toHaveCount(1);
  });

  test("a second, different note is stored after the first save completes", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);

    const firstResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(firstText);
    await page.getByTestId("note-submit").click();
    await firstResponse;

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    const secondResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    const secondNote = (await (await secondResponse).json()) as CreatedNote;

    expect(secondNote.text).toBe(secondText);
    await expect(page.getByTestId(`note-list-item-${secondNote.id}`)).toHaveText(
      secondText,
    );
    await expect(
      page.getByTestId(/^note-list-item-/).filter({ hasText: firstText }),
    ).toHaveCount(1);
  });
});
