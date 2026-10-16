import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method, so the Vite
 * module `src/api/notes.ts` (same substring) is never mistaken for the API.
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

/**
 * Holds every `POST /api/notes` the page sends until `release()` is called,
 * then lets it continue to the real backend. The pending window is therefore
 * deterministic instead of depending on how fast the backend answers.
 */
async function holdCreateRequests(page: Page): Promise<{
  release: () => void;
  sentRequests: Request[];
}> {
  const sentRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(`**${NOTES_PATH}`, async (route) => {
    const request = route.request();
    if (!isNotesApiRequest(request, "POST")) {
      await route.continue();
      return;
    }
    sentRequests.push(request);
    await released;
    await route.continue();
  });

  return { release, sentRequests };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a fast double click on Save note sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);
    const { release, sentRequests } = await holdCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    const submitButton = page.getByTestId("note-submit");
    await submitButton.dblclick();

    // Both clicks are in while the first save is still held by the route.
    await expect(submitButton).toBeDisabled();

    release();
    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByText(noteText, { exact: true })).toHaveCount(1);
    expect(sentRequests).toHaveLength(1);

    // A reload shows what the backend stored: one row, not two.
    await page.unroute(`**${NOTES_PATH}`);
    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;
    await expect(page.getByText(noteText, { exact: true })).toHaveCount(1);
  });

  test("the button is enabled again after the save so a second note saves normally", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);

    const submitButton = page.getByTestId("note-submit");

    const firstResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(firstText);
    await submitButton.click();
    const firstNote = (await (await firstResponse).json()) as CreatedNote;
    await expect(page.getByTestId(`note-list-item-${firstNote.id}`)).toHaveText(
      firstText,
    );
    await expect(submitButton).toBeEnabled();

    const secondResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(secondText);
    await submitButton.click();
    const secondNote = (await (await secondResponse).json()) as CreatedNote;

    expect(secondNote.id).not.toBe(firstNote.id);
    await expect(page.getByTestId(`note-list-item-${secondNote.id}`)).toHaveText(
      secondText,
    );
    await expect(page.getByText(firstText, { exact: true })).toHaveCount(1);
    await expect(page.getByText(secondText, { exact: true })).toHaveCount(1);
  });
});
