import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

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
  });

  it("returns the version the backend reported, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(DEFAULT_VERSION_URL);
    expect(init?.signal).toBeDefined();
  });

  it("returns the commit the backend reported", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });
  });

  it("returns a null commit when the backend reports the unknown commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is empty, missing or not a string", async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({ version: "0.1.0", commit: "" }),
    );
    fetchMock.mockResolvedValueOnce(okResponse({ version: "0.1.0" }));
    fetchMock.mockResolvedValueOnce(
      okResponse({ version: "0.1.0", commit: 1234567 }),
    );

    for (let call = 0; call < 3; call += 1) {
      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("returns a null version when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("throws with the status and reason when the version response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the version response has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("throws when the version string is empty", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );
  });

  it("propagates a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });
});
