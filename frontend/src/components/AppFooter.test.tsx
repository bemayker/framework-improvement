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

  it("renders the application name and the version the client returned", async () => {
    // 9.9.9 is carried by no package, so it proves the footer shows what the
    // client resolved rather than a built-in value.
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.9.9",
      ),
    );
    expect(screen.getByTestId("app-version")).toHaveTextContent("v9.9.9");
  });

  it("fetches the version exactly once", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders exactly the app name when the version request rejects", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("backend down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders exactly the app name when the client resolves null", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders exactly the app name while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
