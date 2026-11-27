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

  it("renders the version returned by the backend", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.8.7");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.8.7"),
    );
  });

  it("renders the backend version rather than the frontend package version", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.8.7");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("9.8.7"),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent("0.0.0");
  });

  it("renders exactly the app name when the backend is unreachable", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders exactly the app name while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
  });
});
