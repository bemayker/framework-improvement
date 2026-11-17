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
    fetchBackendVersionMock.mockResolvedValue("9.8.7");
  });

  it("renders the app name and the backend version once the fetch resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.8.7");
  });

  it("renders the app name alone while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
