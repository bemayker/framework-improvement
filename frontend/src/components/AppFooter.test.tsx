import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
    getBackendBuildInfoMock.mockResolvedValue({
      version: "1.2.3",
      commit: "abc1234",
    });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the version returned by the backend client", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer")).toHaveTextContent(
      "Task Notes v1.2.3",
    );
    expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1);
  });

  it("renders the short commit next to the version", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(abc1234)",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v1.2.3 (abc1234)",
    );
  });

  it("renders only the app name while the build info is pending", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name when the build info request fails", async () => {
    getBackendBuildInfoMock.mockResolvedValue(null);

    render(<AppFooter />);

    await act(async () => {
      await getBackendBuildInfoMock.mock.results[0].value;
    });
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the commit is unavailable", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "1.2.3", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v1.2.3");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
