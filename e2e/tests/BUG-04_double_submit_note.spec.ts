import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/** A `POST /api/notes` the page sent, held until the test releases it. */
type HeldCreate = {
  /** Number of create requests that reached the network layer so far. */
  sentCount: () => number;
  /** Lets every held create request through to the backend. */
  release: () => void;
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

/**
 * Opens the landing page and waits for the mount `GET /api/notes` to settle, so
 * a test never interacts with a list that is still loading.
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
 * Holds every `POST /api/notes` at the network layer so a save stays in flight
 * for as long as the test wants, which is what makes a second submit during the
 * save deterministic instead of a timing race against a fast local backend.
 *
 * The holding counts a request when it is intercepted and forwards it to the
 * real backend only after `release()`, so a duplicate create is both counted and
 * ends up stored, exactly as it would without the hold.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreate> {
  let sent = 0;
  let release!: () => void;
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
      sent += 1;
      await released;
      await route.continue();
    },
  );

  return { sentCount: () => sent, release };
}

/** Waits for the next stored note and returns the row the backend answered with. */
function waitForCreatedNote(page: Page): Promise<CreatedNote> {
  return page
    .waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    )
    .then((response) => response.json() as Promise<CreatedNote>);
}

test.describe("BUG-04 double submit of the note form", () => {
  test("a second submit while the save is in flight sends one request and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double submit");
    await openLandingPage(page);
    const heldCreate = await holdCreateRequests(page);
    const createdNote = waitForCreatedNote(page);

    await page.getByTestId("note-input").fill(noteText);

    // Two native clicks in the same task, so the second one is dispatched before
    // the browser has had a chance to repaint or React to flush the disabled
    // state, the closest the UI gets to a user's double click. Depending on when
    // React commits, the second click lands on an enabled or an already disabled
    // button; either way the fix must send exactly one request.
    await page.getByTestId("note-submit").evaluate((button: HTMLElement) => {
      button.click();
      button.click();
    });
    await expect.poll(() => heldCreate.sentCount()).toBe(1);

    // The Enter key is the other way to submit the form a second time.
    await page.getByTestId("note-input").press("Enter");

    // Still saving: the button is disabled and the held request is the only one.
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    expect(heldCreate.sentCount()).toBe(1);

    heldCreate.release();
    const stored = await createdNote;
    expect(stored.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${stored.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(heldCreate.sentCount()).toBe(1);
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);

    // The backend stored it once too, not only the list in memory.
    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });

  test("a second, different note saves normally after the first save completes", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const heldCreate = await holdCreateRequests(page);

    const firstCreated = waitForCreatedNote(page);
    await page.getByTestId("note-input").fill(firstText);
    await page.getByTestId("note-submit").click();
    await expect.poll(() => heldCreate.sentCount()).toBe(1);
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    heldCreate.release();
    const first = await firstCreated;
    await expect(page.getByTestId(`note-list-item-${first.id}`)).toHaveText(
      firstText,
    );
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    // The hold is released for good, so this second save passes straight through.
    const secondCreated = waitForCreatedNote(page);
    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    const second = await secondCreated;

    expect(second.id).not.toBe(first.id);
    await expect(page.getByTestId(`note-list-item-${second.id}`)).toHaveText(
      secondText,
    );
    await expect(page.getByTestId(`note-list-item-${first.id}`)).toHaveText(
      firstText,
    );
    await expect(page.getByTestId("note-submit")).toBeEnabled();
  });
});
