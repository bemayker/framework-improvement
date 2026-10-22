import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Route } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call.
 */
function isNotesApiUrl(url: URL): boolean {
  return url.pathname === NOTES_PATH;
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
    (response) =>
      response.request().method() === "GET" &&
      isNotesApiUrl(new URL(response.url())) &&
      response.ok(),
  );

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

type HeldCreateRequests = {
  /** Number of `POST /api/notes` calls that reached the network layer. */
  count: () => number;
  /** Resolves once the first POST is being held. */
  firstSeen: Promise<void>;
  /** Lets every held POST through to the backend. */
  release: () => void;
};

/**
 * Holds every `POST /api/notes` until `release()` is called, so the in-flight
 * window of the first save stays open for as long as the test needs, without a
 * fixed timeout. GET calls are passed through untouched.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreateRequests> {
  let seen = 0;
  let markFirstSeen: () => void = () => undefined;
  let release: () => void = () => undefined;
  const firstSeen = new Promise<void>((resolve) => {
    markFirstSeen = resolve;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(isNotesApiUrl, async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    seen += 1;
    markFirstSeen();
    await released;
    await route.continue();
  });

  return { count: () => seen, firstSeen, release };
}

/** The list items showing exactly `text`. */
function listItemsWithText(page: Page, text: string) {
  return page
    .getByTestId(/^note-list-item-/)
    .filter({ hasText: new RegExp(`^${text}$`) });
}

/** Waits for the one created response that follows the release. */
function waitForCreatedResponse(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      isNotesApiUrl(new URL(response.url())) &&
      response.status() === 201,
  );
}

test.describe("BUG-04 double submit stores one note", () => {
  test("a double-click on Save note sends one POST and shows the note once, also after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    await held.firstSeen;

    const created = waitForCreatedResponse(page);
    held.release();
    await created;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    expect(held.count()).toBe(1);

    await page.reload();
    await expect(page.getByTestId("note-list")).toBeAttached();
    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("a click followed by Enter while the save is in flight still sends one POST", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click-enter");
    await openLandingPage(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await held.firstSeen;
    // Enter in the field is the browser's implicit submission, a second submit
    // route that a disabled default button has to suppress as well.
    await page.getByTestId("note-input").press("Enter");

    const created = waitForCreatedResponse(page);
    held.release();
    await created;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    expect(held.count()).toBe(1);
  });
});
