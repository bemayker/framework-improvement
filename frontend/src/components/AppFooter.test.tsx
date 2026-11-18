import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

// A bundle version no backend would report, so the footer showing it is unambiguous.
const BUNDLE_VERSION = "9.9.9-bundle";
vi.mock("../../package.json", () => ({ version: BUNDLE_VERSION }));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

// Flushes the already-settled mock promise and its state update, so an assertion sees the settled footer rather than the pending one.
async function settlePendingPromises() {
  await act(async () => {});
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the version fetched from the backend", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v1.2.3",
      ),
    );
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name alone while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await settlePendingPromises();
    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name alone when the backend reports the unknown sentinel", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await settlePendingPromises();
    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("never shows the frontend bundle's own version", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");
    const { unmount } = render(<AppFooter />);
    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("v1.2.3"),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      BUNDLE_VERSION,
    );
    unmount();

    fetchBackendVersionMock.mockResolvedValue(null);
    render(<AppFooter />);
    await settlePendingPromises();
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      BUNDLE_VERSION,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
