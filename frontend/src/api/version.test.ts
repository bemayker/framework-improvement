import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function stubFetch(response: Partial<Response> | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okJson(body: unknown): Partial<Response> {
  return { ok: true, status: 200, json: async () => body };
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the backend version and calls the version endpoint", async () => {
    const fetchMock = stubFetch(okJson({ version: "1.2.3" }));

    await expect(fetchBackendVersion()).resolves.toBe("1.2.3");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/version$/);
  });

  it("returns null when the fetch rejects", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null on a non-OK status", async () => {
    stubFetch({ ok: false, status: 500, json: async () => ({ version: "1.2.3" }) });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no version", async () => {
    stubFetch(okJson({}));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is empty", async () => {
    stubFetch(okJson({ version: "" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    stubFetch(okJson({ version: 3 }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null for the backend's unknown sentinel", async () => {
    stubFetch(okJson({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });
});
