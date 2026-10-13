import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVersion } from "./version";

// fetch is stubbed rather than the module, so the real client body runs.
const DEFAULT_VERSION_URL = "http://localhost:8010/api/version";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

function failedResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
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

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchVersion()).resolves.toEqual({ version: "0.1.0" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns the commit when the backend sends one", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });
  });

  it.each([
    ["missing", { version: "0.1.0" }],
    ["a non-string", { version: "0.1.0", commit: 42 }],
    ["empty", { version: "0.1.0", commit: "" }],
  ])("omits the commit when it is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    const info = await fetchVersion();

    expect(info).toEqual({ version: "0.1.0" });
    expect(info).not.toHaveProperty("commit");
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it.each([
    ["a body without a version", {}],
    ["an empty version", { version: "" }],
    ["a non-string version", { version: 1 }],
    ["a null body", null],
  ])("throws on %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchVersion()).rejects.toThrow("Loading the version failed");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchVersion: fetchVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
