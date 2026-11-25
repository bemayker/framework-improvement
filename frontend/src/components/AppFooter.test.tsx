import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    fetchBackendVersionMock.mockResolvedValue("9.9.9");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-version");
  });

  it("renders the version the backend reports", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.9.9");
  });

  it("renders the backend version rather than the frontend package version", async () => {
    render(<AppFooter />);

    await screen.findByTestId("app-version");

    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(packageVersion);
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name without a version while the request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the backend has no usable version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    expect(footer).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-version");
  });
});
