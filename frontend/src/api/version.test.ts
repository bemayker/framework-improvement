import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendBuildInfo } from "./version";

function stubFetch(response: Partial<Response> | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okJson(body: unknown): Partial<Response> {
  return { ok: true, status: 200, json: async () => body };
}

describe("fetchBackendBuildInfo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version and commit and calls the version endpoint", async () => {
    const fetchMock = stubFetch(okJson({ version: "1.2.3", commit: "abc1234" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "abc1234",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/version$/);
  });

  it("cuts a 12-character commit to its first 7 characters", async () => {
    stubFetch(okJson({ version: "1.2.3", commit: "0123456789ab" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "0123456",
    });
  });

  it("returns commit null for the backend's unknown sentinel", async () => {
    stubFetch(okJson({ version: "1.2.3", commit: "unknown" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("returns commit null, keeping the version, when the commit is missing", async () => {
    stubFetch(okJson({ version: "1.2.3" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("returns commit null, keeping the version, when the commit is empty", async () => {
    stubFetch(okJson({ version: "1.2.3", commit: "" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("returns commit null, keeping the version, when the commit is not a string", async () => {
    stubFetch(okJson({ version: "1.2.3", commit: 42 }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("returns a commit shorter than 7 characters as-is", async () => {
    stubFetch(okJson({ version: "1.2.3", commit: "abc" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "abc",
    });
  });

  it("returns null when the fetch rejects", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null on a non-OK status", async () => {
    stubFetch({
      ok: false,
      status: 500,
      json: async () => ({ version: "1.2.3", commit: "abc1234" }),
    });

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the body has no version", async () => {
    stubFetch(okJson({ commit: "abc1234" }));

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the version is empty", async () => {
    stubFetch(okJson({ version: "", commit: "abc1234" }));

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    stubFetch(okJson({ version: 3, commit: "abc1234" }));

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null for the backend's unknown version sentinel", async () => {
    stubFetch(okJson({ version: "unknown", commit: "abc1234" }));

    await expect(fetchBackendBuildInfo()).resolves.toBeNull();
  });
});
