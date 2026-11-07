import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendBuild } from "./version";

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

describe("fetchBackendBuild", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version and the 7-character commit from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("keeps a commit shorter than 7 characters as it is", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc12" }));

    await expect(fetchBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it.each([
    ["missing", { version: "0.1.0" }],
    ["empty", { version: "0.1.0", commit: "" }],
    ["not a string", { version: "0.1.0", commit: 1 }],
    ["the unknown sentinel", { version: "0.1.0", commit: "unknown" }],
  ])("keeps the version with commit null when the commit is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns null when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ version: "0.1.0", commit: "0123456789ab" }),
    } as Response);

    await expect(fetchBackendBuild()).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendBuild()).resolves.toBeNull();
  });

  it("returns null when the body is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(fetchBackendBuild()).resolves.toBeNull();
  });

  it.each([
    ["missing", {}],
    ["empty", { version: "" }],
    ["not a string", { version: 1 }],
    ["null body", null],
    ["the unknown sentinel", { version: "unknown", commit: "0123456789ab" }],
  ])("returns null when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendBuild()).resolves.toBeNull();
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendBuild: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
