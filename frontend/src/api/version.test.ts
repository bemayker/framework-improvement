import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAppVersion } from "./version";

const DEFAULT_VERSION_URL = "http://localhost:8010/api/version";

function response(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn<typeof fetch>();

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the backend version from the default base URL", async () => {
    fetchMock.mockResolvedValue(response(true, 200, { version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toEqual({ version: "0.1.0", commit: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchAppVersion: fetchWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(response(true, 200, { version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });

  it("returns null when the response is not 2xx", async () => {
    fetchMock.mockResolvedValue(response(false, 503, { version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no string version", async () => {
    fetchMock.mockResolvedValue(response(true, 200, { version: 3 }));
    await expect(fetchAppVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValue(response(true, 200, {}));
    await expect(fetchAppVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValue(response(true, 200, null));
    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when the body is not valid JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    } as unknown as Response);

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null for an empty version string", async () => {
    fetchMock.mockResolvedValue(response(true, 200, { version: "  " }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null for the backend unknown sentinel", async () => {
    fetchMock.mockResolvedValue(response(true, 200, { version: "unknown" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("cuts the commit to its first 7 characters from the same single request", async () => {
    fetchMock.mockResolvedValue(
      response(true, 200, { version: "0.1.0", commit: "abc1234def56" }),
    );

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps a commit shorter than 7 characters as is", async () => {
    fetchMock.mockResolvedValue(response(true, 200, { version: "0.1.0", commit: " abc " }));

    await expect(fetchAppVersion()).resolves.toEqual({ version: "0.1.0", commit: "abc" });
  });

  it.each([
    ["missing", {}],
    ["not a string", { commit: 42 }],
    ["blank", { commit: "   " }],
    ["the unknown sentinel", { commit: "unknown" }],
  ])("returns the version with a null commit when the commit is %s", async (_label, extra) => {
    fetchMock.mockResolvedValue(response(true, 200, { version: "0.1.0", ...extra }));

    await expect(fetchAppVersion()).resolves.toEqual({ version: "0.1.0", commit: null });
  });

  it("returns null when the version is unusable even if a commit is present", async () => {
    fetchMock.mockResolvedValue(
      response(true, 200, { version: "unknown", commit: "abc1234def56" }),
    );

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchAppVersion()).rejects.toThrow("Failed to fetch");
  });
});
