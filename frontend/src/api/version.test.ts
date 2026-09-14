import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVersion, VERSION_REQUEST_TIMEOUT_MS } from "./version";

// `fetch` is stubbed rather than the module, so the real fetchVersion body runs
// including every rejection branch. The component tests mock this module
// wholesale, so nothing else executes the client itself.
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

function nonJsonResponse(): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async (): Promise<unknown> => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  } as Response;
}

const fetchMock = vi.fn<typeof fetch>();

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version the backend reported, verbatim", async () => {
    // 9.9.9 is deliberately nothing this repo declares anywhere: only a value
    // that travelled from the response can satisfy this.
    fetchMock.mockResolvedValue(okResponse({ version: "9.9.9" }));

    await expect(fetchVersion()).resolves.toBe("9.9.9");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL, {
      signal: expect.any(AbortSignal),
    });
  });

  it("passes the backend's own 'unknown' sentinel through unchanged", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchVersion()).resolves.toBe("unknown");
  });

  it("rejects with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("rejects when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: Failed to fetch",
    );
  });

  it("aborts the request and rejects when it exceeds the timeout", async () => {
    vi.useFakeTimers();
    let abortedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal ?? undefined;
          signal?.addEventListener("abort", () => {
            abortedSignal = signal;
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );

    const pending = fetchVersion();
    const assertion = expect(pending).rejects.toThrow(
      `Loading the version failed: timed out after ${VERSION_REQUEST_TIMEOUT_MS} ms`,
    );
    await vi.advanceTimersByTimeAsync(VERSION_REQUEST_TIMEOUT_MS);
    await assertion;

    expect(abortedSignal?.aborted).toBe(true);
  });

  it("rejects when the response body is not JSON", async () => {
    fetchMock.mockResolvedValue(nonJsonResponse());

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: the response body was not JSON",
    );
  });

  it.each([
    ["an object without a version field", {}],
    ["a non-string version", { version: 1 }],
    ["a blank version", { version: "   " }],
    ["a null body", null],
  ])("rejects on %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: the response carried no version string",
    );
  });

  it("resolves the request URL from VITE_API_BASE_URL when it is configured", async () => {
    // Asserts the resolution rather than the fallback literal: a client that
    // ignored the environment would still pass a default-only assertion while
    // being wrong in every deployment (coding_standards.md Section 5).
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchVersion: fetchVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
      { signal: expect.any(AbortSignal) },
    );
  });
});
