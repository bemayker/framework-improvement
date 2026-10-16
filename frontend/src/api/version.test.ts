import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVersion } from "./version";

const DEFAULT_VERSION_URL = "http://localhost:8010/api/version";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn<typeof fetch>();

describe("fetchVersion", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchVersion()).resolves.toEqual({ version: "0.1.0", commit: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("cuts a 12-character commit to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc12" }));

    await expect(fetchVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it.each([
    ["missing", {}],
    ["not a string", { commit: 123 }],
    ["blank", { commit: "   " }],
    ["the unknown sentinel", { commit: "unknown" }],
  ])("resolves a null commit and keeps the version when the commit is %s", async (_label, extra) => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", ...extra }));

    await expect(fetchVersion()).resolves.toEqual({ version: "0.1.0", commit: null });
  });

  it("rejects with status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("rejects when the body has no version field", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(fetchVersion()).rejects.toThrow();
  });

  it("rejects when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 1 }));

    await expect(fetchVersion()).rejects.toThrow();
  });

  it("rejects when the version is empty or whitespace", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "  " }));

    await expect(fetchVersion()).rejects.toThrow();
  });

  it("rejects when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchVersion()).rejects.toThrow();
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchVersion: fetchVersionWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
