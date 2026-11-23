import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

/** Footer text must never carry a stand-in for a missing version. */
function expectNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer).toHaveTextContent(/^Task Notes$/);
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue("0.1.0");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
  });

  it("renders the backend version once /api/version resolves", async () => {
    getBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v1.2.3",
    );
  });

  it("renders the name alone while the version request is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    expectNameOnly();
  });

  it("renders the name alone when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    // Let the rejected promise settle before asserting the failure state.
    await Promise.resolve();
    expectNameOnly();
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      /undefined|null|unknown/,
    );
  });

  it("renders the name alone when the backend reports the unknown sentinel", async () => {
    getBackendVersionMock.mockResolvedValue("unknown");

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectNameOnly();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
