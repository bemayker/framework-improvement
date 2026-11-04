import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version once resolved", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v9.9.9");
  });

  it("shows the backend version, not the one in package.json", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(packageVersion).not.toBe("9.9.9");
    expect(screen.getByTestId("app-footer").textContent).not.toContain(packageVersion);
  });

  it("renders only the app name when the request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("offline"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    // Let the rejection settle so the assertions below see the post-failure state.
    await act(async () => {});
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders only the app name when the backend version is unknown (null)", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    // Let the resolved null settle so the assertions below see the post-resolution state.
    await act(async () => {});
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders only the app name while the request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });

  it("fetches the version once per mount", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });
});
