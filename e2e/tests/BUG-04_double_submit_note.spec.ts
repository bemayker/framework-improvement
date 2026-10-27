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

/**
 * Holds every `POST /api/notes` open until `release()` is called, and records
 * each one it sees. The held request is then forwarded to the real backend, so
 * the note is genuinely stored once it is released.
 */
async function holdCreateRequests(page: Page): Promise<{
  seenRequests: Request[];
  release: () => void;
}> {
  const seenRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      seenRequests.push(route.request());
      await released;
      await route.continue();
    },
  );

  return { seenRequests, release };
}

/** Releases the held save, then returns the note the backend stored. */
async function releaseAndReadStoredNote(
  page: Page,
  release: () => void,
): Promise<CreatedNote> {
  const createResponse = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );

  release();

  return (await (await createResponse).json()) as CreatedNote;
}

test.describe("BUG-04 double submit of a note", () => {
  test("a second click on Save note while the first save is in flight stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click");
    await openLandingPage(page);
    const { seenRequests, release } = await holdCreateRequests(page);

    const submit = page.getByTestId("note-submit");
    await page.getByTestId("note-input").fill(noteText);
    await submit.click();

    // The first save is now held open: the button must block further submits.
    await expect(submit).toBeDisabled();
    await expect.poll(() => seenRequests.length).toBe(1);

    // Force: the button is disabled, so a normal click would wait for it to
    // become enabled; the point is that a click that does land sends nothing.
    await submit.click({ force: true });

    const createdNote = await releaseAndReadStoredNote(page, release);
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(submit).toBeEnabled();

    expect(seenRequests).toHaveLength(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("pressing Enter twice in the field while the first save is in flight stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const { seenRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");

    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await expect.poll(() => seenRequests.length).toBe(1);

    await input.press("Enter");

    const createdNote = await releaseAndReadStoredNote(page, release);
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );

    expect(seenRequests).toHaveLength(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });
});
