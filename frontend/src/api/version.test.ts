import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersionInfo } from "./version";

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
    vi.resetModules();
  });

  it("returns the backend version from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    const info = await getBackendVersionInfo();
    expect(info.version).toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("requests the configured VITE_API_BASE_URL when one is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.test:9000");
    vi.resetModules();
    const { getBackendVersionInfo: configured } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    const info = await configured();
    expect(info.version).toBe("1.2.3");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test:9000/api/version",
    );
  });

  it("returns the version and the first 7 characters of the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "a1b2c3d4e5f6" }),
    );

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a commit shorter than 7 characters unchanged", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc",
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the body has no commit field", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is blank or not a string", async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({ version: "0.1.0", commit: "   " }),
    );
    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValueOnce(okResponse({ version: "0.1.0", commit: 42 }));
    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null version when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    const info = await getBackendVersionInfo();
    expect(info.version).toBeNull();
  });

  it("returns a null version when the backend reports an empty version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    const info = await getBackendVersionInfo();
    expect(info.version).toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response has no string version field", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });
});
