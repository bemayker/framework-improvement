import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("getVersion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version the backend reports, from the default base URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "0.1.0" }));
    const { getVersion } = await import("./version");

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("returns the version and the commit cut to 7 characters", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "0.1.0", commit: "abc1234def56" }),
    );
    const { getVersion } = await import("./version");

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234",
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "0.1.0", commit: "unknown" }),
    );
    const { getVersion } = await import("./version");

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is empty or not a string", async () => {
    const { getVersion } = await import("./version");

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: "0.1.0", commit: "" }),
    );
    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: "0.1.0", commit: 1234567 }),
    );
    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "0.1.0", commit: "abc12" }),
    );
    const { getVersion } = await import("./version");

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(
      new Response("nope", { status: 404, statusText: "Not Found" }),
    );
    const { getVersion } = await import("./version");

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: 404 Not Found",
    );
  });

  it("throws when the response carries no version string", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: 3 }));
    const { getVersion } = await import("./version");

    await expect(getVersion()).rejects.toThrow("Unexpected version response");
  });

  it("throws when the version string is empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "" }));
    const { getVersion } = await import("./version");

    await expect(getVersion()).rejects.toThrow("Unexpected version response");
  });

  it("returns null when the backend reports its unknown sentinel", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "unknown" }));
    const { getVersion } = await import("./version");

    await expect(getVersion()).resolves.toBeNull();
  });

  it("requests the version from the configured API base URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://backend.example:9000");
    fetchMock.mockResolvedValue(jsonResponse({ version: "2.0.0" }));
    const { getVersion } = await import("./version");

    await getVersion();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.example:9000/api/version",
    );
  });
});
