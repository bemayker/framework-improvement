import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request, type Route } from "@playwright/test";

const NOTES_PATH = "/api/notes";

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
 * Holds every `POST /api/notes` open until `release()` is called, and records
 * each one. Holding the request keeps the save in flight deterministically, so
 * the second submit always happens while the first is pending, with no timing
 * assumption.
 */
async function holdCreateRequests(page: Page): Promise<{
  createRequests: Request[];
  release: () => void;
}> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route: Route) => {
      const request = route.request();
      if (!isNotesApiRequest(request, "POST")) {
        await route.continue();
        return;
      }
      createRequests.push(request);
      await released;
      await route.continue();
    },
  );

  return { createRequests, release };
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("a quick second submit sends one request and stores the note once, also after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    const submit = page.getByTestId("note-submit");
    await input.fill(noteText);
    await submit.click();

    // The save is held in flight, so the button must now be disabled. Pressing
    // Enter in the field is the second submit: a second click() would wait for
    // the disabled button to become enabled again instead of submitting.
    await expect(submit).toBeDisabled();
    await input.press("Enter");

    const created = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await created;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
    await expect(input).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });

  test("the form accepts the next note once the first save has finished", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    const submit = page.getByTestId("note-submit");
    await input.fill(firstText);
    await submit.click();
    await expect(submit).toBeDisabled();

    const firstCreated = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await firstCreated;
    await expect(page.getByTestId("note-list").getByText(firstText)).toHaveCount(1);
    await expect(submit).toBeEnabled();

    // The route is already released, so this second note is not held.
    const secondCreated = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await input.fill(secondText);
    await submit.click();
    await secondCreated;

    await expect(page.getByTestId("note-list").getByText(secondText)).toHaveCount(1);
    expect(createRequests).toHaveLength(2);
  });
});
