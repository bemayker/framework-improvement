import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchAppVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchAppVersion: vi.fn(),
}));

const fetchAppVersionMock = vi.mocked(fetchAppVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
    fetchAppVersionMock.mockResolvedValue("9.9.9-backend");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-version");
  });

  it("renders the version the backend reports once the request resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent(
      "v9.9.9-backend",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v9.9.9-backend",
    );
  });

  it("renders the version the backend reports, not the frontend bundle's own", async () => {
    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(fetchAppVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent("v0.0.0");
  });

  it("renders the app name alone while the version request is pending", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name alone with no version gap when the version request fails", async () => {
    fetchAppVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name alone when the backend version is unresolvable", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalled());
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-version");
  });
});
