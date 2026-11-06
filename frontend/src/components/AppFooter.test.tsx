import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

/** Waits for the mount-time request to be made, then lets it settle. */
async function renderFooter() {
  render(<AppFooter />);
  await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
  // Flush the mock's promise chain so setVersion has run before any assertion.
  await act(async () => {});
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");

    await renderFooter();

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v0\.1\.0$/,
      ),
    );
  });

  it("renders the app name alone when the request is rejected", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    await renderFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("renders the app name alone when the backend reports unknown", async () => {
    fetchBackendVersionMock.mockResolvedValue("unknown");

    await renderFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent("unknown");
  });

  it("renders the app name alone when the version is an empty string", async () => {
    fetchBackendVersionMock.mockResolvedValue("");

    await renderFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("renders the app name alone while the request is pending", async () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    await renderFooter();

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");

    await renderFooter();

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
