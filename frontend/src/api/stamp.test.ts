import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStamp } from "./stamp";

const DEFAULT_STAMP_URL = "http://localhost:8010/api/stamp";

const fetchMock = vi.fn<typeof fetch>();

describe("stamp API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the stamp the backend sent, from the default base URL", async () => {
    const body = { stamp: "ok", db: true };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => body,
    } as Response);

    await expect(getStamp()).resolves.toEqual(body);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_STAMP_URL);
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);

    await expect(getStamp()).rejects.toThrow(
      "Loading the stamp failed: 500 Internal Server Error",
    );
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getStamp: getStampWithConfiguredBase } = await import("./stamp");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ stamp: "ok", db: false }),
    } as Response);

    await getStampWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/stamp");
  });
});
