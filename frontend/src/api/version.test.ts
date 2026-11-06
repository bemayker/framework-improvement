import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";
import { API_BASE_URL } from "./baseUrl";

function stubFetch(response: Partial<Response> | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version and calls the version endpoint", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0" }),
    });

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/version`);
  });

  it("throws on a non-OK status", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the body has no string version", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 3 }) });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Unexpected version response",
    );
  });

  it("throws when the body is not an object", async () => {
    stubFetch({ ok: true, json: async () => null });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Unexpected version response",
    );
  });

  it("rejects on a network error", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });
});
