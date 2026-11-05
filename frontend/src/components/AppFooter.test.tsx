import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  getVersion: vi.fn(),
}));

const getVersionMock = vi.mocked(getVersion);

function footerText(): string {
  return screen.getByTestId("app-footer").textContent ?? "";
}

describe("AppFooter", () => {
  beforeEach(() => {
    getVersionMock.mockReset();
  });

  it("renders the app name and the backend version once it resolves", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9" });

    render(<AppFooter />);

    await waitFor(() => expect(footerText()).toBe("Task Notes v9.9.9"));
    expect(footerText()).not.toContain(packageVersion);
  });

  it("renders exactly the app name while the version is pending", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(footerText()).toBe("Task Notes");
  });

  it("renders exactly the app name when the version request rejects", async () => {
    getVersionMock.mockRejectedValue(new Error("Loading the version failed"));

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(footerText()).toBe("Task Notes");
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    getVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abc1234def56",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(footerText()).toBe("Task Notes v9.9.9 (abc1234)"),
    );
  });

  it("renders the version alone when the commit is unknown", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: "unknown" });

    render(<AppFooter />);

    await waitFor(() => expect(footerText()).toBe("Task Notes v9.9.9"));
  });

  it("shows a commit shorter than 7 characters whole", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: "abc" });

    render(<AppFooter />);

    await waitFor(() => expect(footerText()).toBe("Task Notes v9.9.9 (abc)"));
  });

  it("never shows undefined, null, an error or empty parentheses while pending or rejected", async () => {
    getVersionMock.mockReturnValueOnce(new Promise(() => {}));
    const pending = render(<AppFooter />);
    expect(footerText()).toBe("Task Notes");
    pending.unmount();

    getVersionMock.mockRejectedValueOnce(new Error("Loading the version failed"));
    render(<AppFooter />);
    await act(async () => {});

    expect(footerText()).toBe("Task Notes");
    expect(footerText()).not.toMatch(/undefined|null|Error|\(\)/);
  });

  it("renders exactly the app name when the version is unknown even with a real commit", async () => {
    getVersionMock.mockResolvedValue({ version: "unknown", commit: "abc1234def56" });

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(footerText()).toBe("Task Notes");
  });

  it("renders exactly the app name when the backend reports unknown", async () => {
    getVersionMock.mockResolvedValue({ version: "unknown" });

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(footerText()).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
