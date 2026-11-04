import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

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

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = `BUG-04 double click ${randomUUID().slice(0, 8)}`;
    let createRequestCount = 0;
    let releaseFirstCreate: () => void = () => {};
    const firstCreateHeld = new Promise<void>((resolve) => {
      releaseFirstCreate = resolve;
    });

    // Hold the first POST open so the second click lands while the save is in
    // flight, which is the window the defect lived in.
    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        createRequestCount += 1;
        await firstCreateHeld;
        await route.continue();
      },
    );

    await openLandingPage(page);

    const submitButton = page.getByTestId("note-submit");
    await page.getByTestId("note-input").fill(noteText);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );
    await submitButton.dblclick();

    // Side check of the in-flight guard; the criterion itself is the count below.
    await expect(submitButton).toBeDisabled();

    releaseFirstCreate();
    await createResponse;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
    await expect(submitButton).toBeEnabled();
    expect(createRequestCount).toBe(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(
      page.getByTestId("note-list").getByText(noteText, { exact: true }),
    ).toHaveCount(1);
  });
});
