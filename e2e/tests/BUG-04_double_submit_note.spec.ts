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
 * a test never interacts with a list that is still loading (a late mount
 * response replaces the whole notes state and would drop a note added first).
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

/** Fills `text`, double-clicks "Save note" and returns the note the backend stored. */
async function doubleClickSave(page: Page, text: string): Promise<CreatedNote> {
  const createResponse = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );

  await page.getByTestId("note-input").fill(text);
  await page.getByTestId("note-submit").dblclick();

  return (await (await createResponse).json()) as CreatedNote;
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note sends one POST and lists the note once, also after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const createdNote = await doubleClickSave(page, noteText);
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("saves a second distinct note normally after a double-clicked save completed", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const firstNote = await doubleClickSave(page, firstText);
    await expect(page.getByTestId(`note-list-item-${firstNote.id}`)).toHaveText(
      firstText,
    );
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    const secondResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    const secondNote = (await (await secondResponse).json()) as CreatedNote;

    await expect(page.getByTestId(`note-list-item-${secondNote.id}`)).toHaveText(
      secondText,
    );
    expect(secondNote.id).not.toBe(firstNote.id);
    expect(createRequests).toHaveLength(2);
    await expect(
      page.getByTestId("note-list").getByText(firstText, { exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("note-list").getByText(secondText, { exact: true }),
    ).toHaveCount(1);
  });
});
