import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version");

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectFooterWithoutVersion() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the application name", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the backend version once it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");
    render(<AppFooter />);

    const version = await screen.findByTestId("app-footer-version");
    expect(version.textContent).toBe(" v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0");
  });

  it("shows the version the client returned and fetches it once on mount", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");
    render(<AppFooter />);

    await screen.findByText("v9.9.9", { exact: false });
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name alone while the version is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));
    render(<AppFooter />);

    expectFooterWithoutVersion();
  });

  it("renders the app name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));
    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    await waitFor(() => expectFooterWithoutVersion());
  });

  it("renders the app name alone when the backend version is unresolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);
    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    await waitFor(() => expectFooterWithoutVersion());
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
