import { test, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";

/**
 * TEST-03 simple note form.
 *
 * The notes API exposes no delete endpoint, so specs cannot tear their rows down
 * again. Isolation comes from data instead: every spec writes its own unique note
 * text and asserts only on that text, so specs stay independent of each other and
 * of whatever the shared database already holds, and may run in parallel.
 */

const NOTE_TEXT_PREFIX = "TEST-03 e2e note";
const NOTES_ENDPOINT = "/api/notes";
const NO_RELOAD_MARKER = "__test03NoReloadMarker";

let noteCounter = 0;

/** A note text no other spec, worker, or earlier run can collide with. */
function uniqueNoteText(label: string): string {
  noteCounter += 1;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${noteCounter}`;
  return `${NOTE_TEXT_PREFIX} ${label} ${suffix}`;
}

function isNotesPost(request: Request): boolean {
  return request.method() === "POST" && request.url().includes(NOTES_ENDPOINT);
}

/** Records every POST to the notes API from now on, for "no API call" assertions. */
function recordNotesPosts(page: Page): Request[] {
  const posts: Request[] = [];
  page.on("request", (request) => {
    if (isNotesPost(request)) {
      posts.push(request);
    }
  });
  return posts;
}

/**
 * Marks the current document so a full page reload becomes observable: the marker
 * is set on `window` and does not survive a navigation.
 */
async function markDocument(page: Page): Promise<void> {
  await page.evaluate((marker) => {
    (window as unknown as Record<string, boolean>)[marker] = true;
  }, NO_RELOAD_MARKER);
}

async function documentStillMarked(page: Page): Promise<boolean> {
  return page.evaluate(
    (marker) => (window as unknown as Record<string, boolean>)[marker] === true,
    NO_RELOAD_MARKER,
  );
}

test.describe("TEST-03 simple note form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("note-form")).toBeVisible();
  });

  test("submitting a non-empty note stores it and shows it in the list without a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("created");
    await markDocument(page);

    const postResponse = page.waitForResponse(
      (response) => isNotesPost(response.request()) && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await postResponse;

    await expect(page.getByTestId("note-list")).toContainText(noteText);
    expect(await documentStillMarked(page)).toBe(true);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("notes-error")).toHaveCount(0);
  });

  test("submitting an empty note shows a validation message and calls no API", async ({ page }) => {
    const notesPosts = recordNotesPosts(page);

    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-validation-error")).toBeVisible();
    expect(notesPosts).toHaveLength(0);
    await expect(page.getByTestId("note-input")).toHaveAttribute("aria-invalid", "true");
  });

  test("submitting a whitespace-only note shows a validation message and calls no API", async ({
    page,
  }) => {
    const notesPosts = recordNotesPosts(page);

    await page.getByTestId("note-input").fill("   ");
    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-validation-error")).toBeVisible();
    expect(notesPosts).toHaveLength(0);
  });

  test("a saved note is still listed after reloading the page", async ({ page }) => {
    const noteText = uniqueNoteText("persisted");

    const postResponse = page.waitForResponse(
      (response) => isNotesPost(response.request()) && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await postResponse;
    await expect(page.getByTestId("note-list")).toContainText(noteText);

    const listResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes(NOTES_ENDPOINT) &&
        response.status() === 200,
    );
    await page.reload();
    await listResponse;

    await expect(page.getByTestId("note-list")).toContainText(noteText);
  });
});
