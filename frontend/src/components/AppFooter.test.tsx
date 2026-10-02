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
    fetchBackendVersionMock.mockResolvedValue("9.9.9-test");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-version");
  });

  it("renders the version the backend returned (present path)", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent(
      "9.9.9-test",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9-test",
    );
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the name alone while the version is loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).toBeNull();
  });

  it("renders the name alone when the version cannot be resolved (absent path)", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("unreachable"));

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    // Let the rejection settle before asserting the final state.
    await Promise.resolve();

    const text = screen.getByTestId("app-footer").textContent ?? "";
    expect(text).toBe("Task Notes");
    expect(text).not.toMatch(/undefined|null|unknown| v$/);
    expect(screen.queryByTestId("app-version")).toBeNull();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-version");
  });
});
