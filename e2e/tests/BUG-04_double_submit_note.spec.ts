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
  test("sends one create request and lists the note once when the form is submitted again while the save is in flight", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);

    // Holds the first POST at the network edge, so the save stays in flight
    // for as long as the test needs without any fixed wait.
    let releaseCreate: () => void = () => {};
    const createReleased = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        await createReleased;
        await route.continue();
      },
    );

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    const firstCreateSent = page.waitForRequest((request) =>
      isNotesApiRequest(request, "POST"),
    );
    const input = page.getByTestId("note-input");
    const submit = page.getByTestId("note-submit");

    await input.fill(noteText);
    await submit.click();
    await firstCreateSent;

    // Both ways a user can submit again: Enter in the field, and a click that
    // bypasses Playwright's actionability wait for an enabled button.
    await input.press("Enter");
    await submit.click({ force: true });

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );
    releaseCreate();
    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    const noteItem = page.getByTestId(`note-list-item-${createdNote.id}`);
    await expect(noteItem).toHaveText(noteText);
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItem).toHaveText(noteText);
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });
});
