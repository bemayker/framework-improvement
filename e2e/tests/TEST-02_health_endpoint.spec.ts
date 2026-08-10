import { test, expect } from "@playwright/test";

/**
 * The backend, not the frontend, is the subject here, so this spec addresses it
 * directly instead of through `playwright.config.ts`'s frontend `baseURL`.
 * Defaults to docker-compose.yml's remapped backend host port (the compose host
 * ports are offset, so 8000 is wrong); `BACKEND_URL` overrides it for a backend
 * started on another port.
 */
const BACKEND_BASE_URL = process.env.BACKEND_URL ?? "http://localhost:8010";
const HEALTH_URL = `${BACKEND_BASE_URL}/api/health`;

test.describe("TEST-02 health endpoint", () => {
  test("returns 200 with the ok status when the backend and its database are reachable", async ({
    request,
  }) => {
    const response = await request.get(HEALTH_URL);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("rejects a POST to the health endpoint with 405 Method Not Allowed", async ({
    request,
  }) => {
    // No POST handler is registered, so FastAPI answers 405. Asserting it here
    // pins the contract: a future write-shaped health handler would be a silent
    // change in what an unauthenticated caller can do to the service.
    const response = await request.post(HEALTH_URL);

    expect(response.status()).toBe(405);
  });
});
