import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

/** Asserts the footer is exactly the app name: no version or commit text. */
function expectAppNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("renders the short commit next to the version once the fetch resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("app-commit")).toHaveTextContent("(0123456)");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0 (0123456)",
    );
  });

  it("renders the version alone when the backend reports no commit", async () => {
    getBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the app name without a version or commit while the fetch is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectAppNameOnly();
  });

  it("renders the app name without a version or commit when the backend is unreachable", async () => {
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
