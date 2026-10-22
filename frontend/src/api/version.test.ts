import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

async function loadClient() {
  vi.resetModules();
  return import("./version");
}

describe("fetchBackendVersion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("resolves to the version the backend returned", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "0.1.0" }));
    const { fetchBackendVersion } = await loadClient();

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
  });

  it("calls the default backend URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", undefined as unknown as string);
    fetchMock.mockResolvedValue(jsonResponse({ version: "0.1.0" }));
    const { fetchBackendVersion } = await loadClient();

    await fetchBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("calls the URL configured through VITE_API_BASE_URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.test");
    fetchMock.mockResolvedValue(jsonResponse({ version: "0.1.0" }));
    const { fetchBackendVersion } = await loadClient();

    await fetchBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith("http://api.example.test/api/version");
  });

  it.each([
    ["missing", {}],
    ["empty", { version: "" }],
    ["unknown sentinel", { version: "unknown" }],
    ["non-string", { version: 3 }],
  ])("resolves to null when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    const { fetchBackendVersion } = await loadClient();

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("ignores extra fields such as commit", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ version: "0.1.0", commit: "abc1234" }),
    );
    const { fetchBackendVersion } = await loadClient();

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
  });

  it("throws when the backend answers non-OK", async () => {
    fetchMock.mockResolvedValue(
      new Response("boom", { status: 500, statusText: "Server Error" }),
    );
    const { fetchBackendVersion } = await loadClient();

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });
});
