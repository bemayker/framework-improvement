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

  it("renders the app name and the backend version when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v1\.2\.3$/,
      ),
    );
  });

  it("renders exactly the app name when the version is unresolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders only the app name while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
