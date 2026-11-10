import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendBuildInfo: vi.fn(),
}));

const fetchBackendBuildInfoMock = vi.mocked(fetchBackendBuildInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendBuildInfoMock.mockReset();
  });

  it("renders the app name, the version and the short commit when it resolves", async () => {
    fetchBackendBuildInfoMock.mockResolvedValue({ version: "1.2.3", commit: "abc1234" });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v1.2.3 (abc1234)",
      ),
    );
  });

  it("renders the version alone when the commit is unusable", async () => {
    fetchBackendBuildInfoMock.mockResolvedValue({ version: "1.2.3", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v1.2.3"),
    );
  });

  it("renders exactly the app name when the build info is unresolved", async () => {
    fetchBackendBuildInfoMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendBuildInfoMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders only the app name while the request is still pending", () => {
    fetchBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendBuildInfoMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
