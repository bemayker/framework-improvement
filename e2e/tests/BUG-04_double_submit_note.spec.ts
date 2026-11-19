import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request, type Route } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method. A substring check
 * would also catch Vite's `src/api/notes.ts` module request.
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

type HeldCreate = {
  /** Resolves once the first `POST /api/notes` is held at the network layer. */
  firstRequestHeld: Promise<void>;
  /** Lets every held request through to the real backend. */
  release: () => void;
  /** Number of `POST /api/notes` requests that reached the network layer. */
  requestCount: () => number;
};

/**
 * Holds every `POST /api/notes` until `release()`, so the save stays in flight
 * for as long as the test needs. Other calls (the list load) pass through.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreate> {
  let requests = 0;
  let signalFirstHeld: () => void = () => {};
  let release: () => void = () => {};
  const firstRequestHeld = new Promise<void>((resolve) => {
    signalFirstHeld = resolve;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route: Route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      requests += 1;
      signalFirstHeld();
      await released;
      await route.continue();
    },
  );

  return { firstRequestHeld, release, requestCount: () => requests };
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when Save note is clicked twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    // Two clicks in the same instant, while the first save is still pending.
    await page.getByTestId("note-submit").dblclick();
    await held.firstRequestHeld;

    const created = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await created;
    expect(held.requestCount()).toBe(1);

    const matchingItems = page
      .getByTestId(/^note-list-item-/)
      .filter({ hasText: noteText });
    await expect(matchingItems).toHaveCount(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(matchingItems).toHaveCount(1);
  });

  test("sends one save request when submitted twice while the first save is in flight", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("in flight");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await held.firstRequestHeld;

    // A second submit by keyboard while the first save is still pending.
    await page.getByTestId("note-input").press("Enter");
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const created = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await created;

    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(held.requestCount()).toBe(1);
    await expect(
      page.getByTestId(/^note-list-item-/).filter({ hasText: noteText }),
    ).toHaveCount(1);
  });
});
