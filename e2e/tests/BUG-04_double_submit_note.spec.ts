import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request, type Route } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check would also catch Vite's `src/api/notes.ts` module fetch).
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

/**
 * Holds every `POST /api/notes` until `release()` is called, which simulates a
 * slow save. Other requests (including CORS preflights) pass through untouched.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ release: () => void }> {
  let release: () => void = () => undefined;
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
      await released;
      await route.continue();
    },
  );

  return { release };
}

async function reloadAndWaitForList(page: Page): Promise<void> {
  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("pressing Enter twice while the save is pending sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const hold = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    hold.release();
    await createResponse;

    const matchingItems = page
      .getByTestId("note-list")
      .getByText(noteText, { exact: true });
    await expect(matchingItems).toHaveCount(1);
    await expect(input).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    await reloadAndWaitForList(page);
    await expect(matchingItems).toHaveCount(1);
  });

  test("keeps the Save note button disabled while the save is pending and enables it afterwards", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("button");
    await openLandingPage(page);
    const hold = await holdCreateRequests(page);

    const submit = page.getByTestId("note-submit");
    await expect(submit).toBeEnabled();

    await page.getByTestId("note-input").fill(noteText);
    await submit.click();
    await expect(submit).toBeDisabled();

    hold.release();

    await expect(submit).toBeEnabled();
    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });
});
