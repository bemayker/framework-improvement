import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVersion } from "./version";

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
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getVersion()).resolves.toEqual({ version: "0.1.0" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getVersion: getVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await getVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });

  it("returns the commit when the response carries a usable one", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234def56" }),
    );

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234def56",
    });
  });

  it("ignores extra fields in the response", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234", build: "nightly" }),
    );

    await expect(getVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234",
    });
  });

  it.each([
    ["missing", { version: "0.1.0" }],
    ["not a string", { version: "0.1.0", commit: 1234 }],
    ["blank", { version: "0.1.0", commit: "   " }],
  ])("returns the version alone when commit is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getVersion()).resolves.toEqual({ version: "0.1.0" });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it.each([
    ["missing", {}],
    ["not a string", { version: 1 }],
    ["empty", { version: "   " }],
  ])("throws on an unexpected shape when version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });
});
