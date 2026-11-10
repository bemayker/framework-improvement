import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchBackendVersion);

function expectFooterWithoutVersion() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(footer.textContent).not.toMatch(/undefined|null|unknown| v$/);
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
  });

  it("renders the app name and the backend version once it resolves", async () => {
    fetchVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.9.9");
  });

  it("renders the app name alone while the version is still pending", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectFooterWithoutVersion();
  });

  it("renders the app name alone when the version request rejects", async () => {
    fetchVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectFooterWithoutVersion();
  });

  it("renders the app name alone when the client resolves null", async () => {
    fetchVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectFooterWithoutVersion();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);
    await screen.findByTestId("app-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
