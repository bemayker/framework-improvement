import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue("9.8.7");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the version the backend reports, not the frontend package version", async () => {
    render(<AppFooter />);

    const version = await screen.findByTestId("app-footer-version");
    expect(version).toHaveTextContent("v9.8.7");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v9.8.7",
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent("0.0.0");
  });

  it("renders only the app name while the version is loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    // The rejection reaches the component's .catch a few microtasks after the
    // call, so flush them before asserting the footer stayed on the app name.
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
