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
    fetchBackendVersionMock.mockResolvedValue({ version: "9.8.7", commit: "abc1234" });
  });

  it("renders the version and the short commit once the fetch resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.getByTestId("app-commit")).toHaveTextContent("(abc1234)");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.8.7 (abc1234)",
    );
  });

  it("renders the version alone when the backend reports no usable commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "9.8.7", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v9.8.7");
  });

  it("renders no commit while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders no commit when the version request fails", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    // Flush the resolved null through setVersion before asserting, so this checks
    // the resolved-failure render and not the pending state again.
    await act(async () => {});
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
