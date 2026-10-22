import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("shows the backend version once it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v1.2.3");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v1.2.3");
  });

  it("shows the name only while the version is loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNameOnly();
  });

  it("shows the name only when the version request is rejected", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectNameOnly();
  });

  it("shows the name only when the client resolves no usable version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectNameOnly();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
