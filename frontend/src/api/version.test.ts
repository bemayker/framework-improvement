import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function respondWith(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version and requests /api/version", async () => {
    const fetchMock = respondWith({ version: "0.1.0", commit: "3f9c2a1b7d4e" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "3f9c2a1b7d4e",
    });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/version$/);
  });

  it("returns the commit as the backend reported it", async () => {
    respondWith({ version: "0.1.0", commit: "abc123" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc123",
    });
  });

  it("returns a null commit when the body has no commit", async () => {
    respondWith({ version: "0.1.0" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is not a string", async () => {
    respondWith({ version: "0.1.0", commit: 12345 });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is empty", async () => {
    respondWith({ version: "0.1.0", commit: "" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit for the backend's unknown sentinel", async () => {
    respondWith({ version: "0.1.0", commit: "unknown" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns null on a non-2xx answer", async () => {
    respondWith({ version: "0.1.0" }, { ok: false, status: 500 });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no version", async () => {
    respondWith({});

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    respondWith({ version: 1 });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is empty", async () => {
    respondWith({ version: "" });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body is null", async () => {
    respondWith(null);

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null for the backend's unknown sentinel", async () => {
    respondWith({ version: "unknown" });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });
});
