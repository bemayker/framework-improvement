import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

/** Asserts the footer is exactly the app name: no version text, no gap. */
function expectAppNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue("0.1.0");
  });

  it("renders the backend version once the fetch resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0");
  });

  it("renders the app name without a version while the fetch is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectAppNameOnly();
  });

  it("renders the app name without a version when the backend is unreachable", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    expectAppNameOnly();
    expect(screen.getByTestId("app-footer").textContent).not.toMatch(
      /undefined|null|unknown/,
    );
  });

  it("renders the app name without a version when the backend reports unknown", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    expectAppNameOnly();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
