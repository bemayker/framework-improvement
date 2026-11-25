import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("fetchBackendVersion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the backend version from the default base URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "9.9.9" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "9.9.9",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("returns the backend commit alongside the version", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "9.9.9", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "9.9.9",
      commit: "0123456789ab",
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "9.9.9", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "9.9.9",
      commit: null,
    });
  });

  it("returns a null commit when the commit is empty, missing or not a string", async () => {
    for (const commit of ["", undefined, 12345, null]) {
      fetchMock.mockResolvedValueOnce(jsonResponse({ version: "9.9.9", commit }));

      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "9.9.9",
        commit: null,
      });
    }
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no usable version", async () => {
    for (const body of [{}, { version: "" }, { version: 3 }, null]) {
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      await expect(fetchBackendVersion()).resolves.toBeNull();
    }
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(
      new Response("", { status: 503, statusText: "Service Unavailable" }),
    );

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });
});
