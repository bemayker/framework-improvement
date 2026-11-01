import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method; a substring
 * check would also catch Vite's `src/api/notes.ts` module fetch.
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

/** Opens the landing page and waits for the mount list load to settle. */
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
 * Holds every create request until the returned `release` is called, so a
 * second click lands inside the pending-save window deterministically.
 */
async function holdCreateRequests(page: Page): Promise<{ release: () => void }> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        await released;
      }
      await route.continue();
    },
  );

  return { release };
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on save sends one create request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const hold = await holdCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    hold.release();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-list-item-" + createdNote.id)).toHaveCount(1);
    await expect(page.getByTestId("note-list").getByText(noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
  });

  test("the form accepts the next note once the held save has finished", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const hold = await holdCreateRequests(page);

    const firstResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(firstText);
    await page.getByTestId("note-submit").dblclick();
    hold.release();
    await firstResponse;
    await expect(page.getByTestId("note-submit")).toBeEnabled();

    const secondResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    const secondNote = (await (await secondResponse).json()) as CreatedNote;

    await expect(page.getByTestId(`note-list-item-${secondNote.id}`)).toHaveText(
      secondText,
    );
    await expect(page.getByTestId("note-list").getByText(firstText)).toHaveCount(1);
  });
});
