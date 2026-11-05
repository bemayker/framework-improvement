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
 * module `src/api/notes.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call.
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

/**
 * Opens the landing page and waits for the mount `GET /api/notes` to settle, so
 * the test never interacts with a list that is still loading.
 */
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
  test("a double-click on Save note sends one POST and lists the note once, also after a reload", async ({
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

    // Hold the first POST until both clicks have landed, so the second click is
    // guaranteed to arrive while the first save is still in flight. The held
    // request still reaches the real backend once it is released.
    let releasePost: () => void = () => {};
    const postHeld = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        await postHeld;
        await route.continue();
      },
    );

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    releasePost();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
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
});
