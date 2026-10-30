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
  });

  it("renders the version and the first 7 characters of the commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "0.1.0",
      commit: "3f9c2a1b7d4e",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v0.1.0 (3f9c2a1)",
      ),
    );
  });

  it("renders the version alone when there is no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0"),
    );
  });

  it("renders exactly the app name when the version cannot be resolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/v|undefined|null|\(/);
  });

  it("renders the app name alone before the version resolves", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null|\(/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "0.1.0",
      commit: "3f9c2a1b7d4e",
    });

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await waitFor(() => expect(footer).toHaveTextContent("v0.1.0"));
  });
});
