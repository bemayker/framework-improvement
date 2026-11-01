import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version once it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v0.1.0",
    );
  });

  it("shows the backend version even when it differs from package.json", async () => {
    const divergingVersion = `${packageVersion}-backend`;
    fetchBackendVersionMock.mockResolvedValue(divergingVersion);

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer")).toHaveTextContent(
      `Task Notes v${divergingVersion}`,
    );
  });

  it("shows the app name alone while the version is loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("shows the app name alone when the version request is rejected", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("shows the app name alone when no version is resolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
