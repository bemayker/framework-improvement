import { randomUUID } from "node:crypto";
import {
  test,
  expect,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";

const NOTES_PATH = "/api/notes";

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

/** Waits for the mount `GET /api/notes` to settle before interacting. */
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
 * Holds every `POST /api/notes` the page issues until `release` is called, then
 * forwards it to the real backend. Records each request it saw, so a spec can
 * count how many saves the form really sent while the first was in flight.
 */
async function holdCreateRequests(page: Page): Promise<{
  seenRequests: Request[];
  firstRequestHeld: Promise<void>;
  release: () => void;
}> {
  const seenRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markFirstHeld: () => void = () => undefined;
  const firstRequestHeld = new Promise<void>((resolve) => {
    markFirstHeld = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route: Route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }
      seenRequests.push(request);
      markFirstHeld();
      await released;
      await route.continue();
    },
  );

  return { seenRequests, firstRequestHeld, release };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const { seenRequests, firstRequestHeld, release } =
      await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    // The first click starts the save and the request stays held, so the second
    // click lands while the first save is still in flight.
    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-submit").dblclick();
    await firstRequestHeld;
    release();
    await createResponse;

    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(seenRequests).toHaveLength(1);

    // The backend stored it once too: a reload shows a single copy.
    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
  });

  test("Save note is enabled again after the held save completes, so a second note can be saved", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const { firstRequestHeld, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(firstText);
    await page.getByTestId("note-submit").click();
    await firstRequestHeld;
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    release();
    await expect(page.getByTestId("note-list").getByText(firstText)).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    await expect(page.getByTestId("note-list").getByText(secondText)).toHaveCount(1);
    await expect(page.getByTestId("note-list").getByText(firstText)).toHaveCount(1);
  });
});
