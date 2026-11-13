import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
  });

  it("renders the version returned by /api/version, not the frontend package version", async () => {
    fetchVersionMock.mockResolvedValue("9.8.7");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.8.7",
      ),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${packageVersion}`,
    );
  });

  it("renders the app name only when /api/version is unreachable", async () => {
    fetchVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await act(async () => {});

    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name only when the backend reports the unknown sentinel", async () => {
    fetchVersionMock.mockResolvedValue("unknown");

    render(<AppFooter />);

    await act(async () => {});

    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name only while the version is loading", () => {
    fetchVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
