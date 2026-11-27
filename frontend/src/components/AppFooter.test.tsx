import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchVersion);

/** Renders the footer and waits until the mount-time version request has settled. */
async function renderSettledFooter() {
  render(<AppFooter />);
  await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
  // Let the resolved or rejected promise flush into component state.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
  });

  it("renders the version the API client returned", async () => {
    fetchVersionMock.mockResolvedValue("4.5.6");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent("v4.5.6");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v4.5.6");
  });

  it("renders exactly Task Notes while the version is loading", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders exactly Task Notes when the version request fails", async () => {
    fetchVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    await renderSettledFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders exactly Task Notes when the backend reports the unknown sentinel", async () => {
    fetchVersionMock.mockResolvedValue("unknown");

    await renderSettledFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders exactly Task Notes when the backend reports a blank version", async () => {
    fetchVersionMock.mockResolvedValue("   ");

    await renderSettledFooter();

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
