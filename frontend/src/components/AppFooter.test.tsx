import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue("9.8.7");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("shows only the name while the version is loading", async () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("shows the version the backend reported", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "9.8.7",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.8.7",
    );
  });

  it.each([
    ["the version cannot be resolved", () => getBackendVersionMock.mockResolvedValue(null)],
    [
      "the request fails",
      () => getBackendVersionMock.mockRejectedValue(new Error("network down")),
    ],
  ])("renders without a version when %s", async (_label, arrange) => {
    arrange();

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    await waitFor(() =>
      expect(footer.textContent).toBe("Task Notes · version unavailable"),
    );
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(footer.textContent).not.toContain("undefined");
    expect(footer.textContent).not.toContain("null");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
