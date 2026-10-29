import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

// `fetch` is stubbed so the real client body runs, including every
// unresolved-version branch the footer maps to "no version segment".
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

describe("fetchBackendVersion", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version from a 200 body, requested from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL, {
      signal: expect.any(AbortSignal),
    });
  });

  it("requests the configured VITE_API_BASE_URL when it is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("ignores extra fields in the body", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc123" }),
    );

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
  });

  it.each([
    [500, "Internal Server Error"],
    [503, "Service Unavailable"],
  ])("throws with the status and reason on a %i response", async (status, text) => {
    fetchMock.mockResolvedValue(failedResponse(status, text));

    await expect(fetchBackendVersion()).rejects.toThrow(
      `Loading the backend version failed: ${status} ${text}`,
    );
  });

  it.each([
    ["no version field", {}],
    ["a non-string version", { version: 1 }],
    ["an empty version", { version: "" }],
    ["a null body", null],
  ])("throws on a body with %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );
  });

  it("throws on the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).rejects.toThrow("unresolved");
  });

  it("propagates a network rejection", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("aborts the request and rejects when the backend does not answer within 5 seconds", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const outcome = expect(fetchBackendVersion()).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(5000);

    await outcome;
  });
});
