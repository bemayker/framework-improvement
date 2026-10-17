import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchAppVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchAppVersion: vi.fn(),
}));

const fetchAppVersionMock = vi.mocked(fetchAppVersion);

// A value that exists nowhere in the frontend, so it can only come from the client.
const MOCKED_VERSION = "9.9.9-test";

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
    fetchAppVersionMock.mockResolvedValue(MOCKED_VERSION);
  });

  it("renders the application name", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-version");

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version returned by the client once it resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent(
      `v${MOCKED_VERSION}`,
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      `Task Notes v${MOCKED_VERSION}`,
    );
  });

  it("shows the app name alone while the version is loading", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("shows the app name alone when the version request is rejected", async () => {
    fetchAppVersionMock.mockRejectedValue(new Error("Loading the version failed"));

    render(<AppFooter />);
    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("shows the app name alone when the client resolves no version", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));

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
