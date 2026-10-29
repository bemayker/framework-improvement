import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9-test",
      commit: "4f2a9c1e8b7d",
    });
  });

  it("renders the app name, the backend version and the 7-character commit once they resolve", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9-test (4f2a9c1)",
    );
    expect(screen.getByTestId("app-footer-commit")).toHaveTextContent("(4f2a9c1)");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the version alone when the response carries no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9-test",
      commit: null,
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9-test",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders exactly the app name while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders exactly the app name when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
