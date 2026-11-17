import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getAppVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getAppVersion: vi.fn(),
}));

const getAppVersionMock = vi.mocked(getAppVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getAppVersionMock.mockReset();
  });

  it("renders the version returned by the backend", async () => {
    getAppVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.9.9",
      ),
    );
  });

  it("renders the app name without a version while the request is pending", () => {
    getAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
  });

  it("renders the app name without a version when the request fails", async () => {
    getAppVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(getAppVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
  });

  it("renders the app name without a version when the backend reports none", async () => {
    getAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getAppVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
