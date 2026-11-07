import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version as bundleVersion } from "../../package.json";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v0.1.0");
  });

  it("renders the app name alone when the version cannot be resolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await vi.waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("reads exactly the app name while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("shows the backend version, not the frontend bundle's own", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "9.9.9",
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${bundleVersion}`,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
