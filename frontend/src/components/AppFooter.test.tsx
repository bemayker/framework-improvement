import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version } from "../../package.json";
import { getVersionInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getVersionInfo: vi.fn(),
}));

const getVersionInfoMock = vi.mocked(getVersionInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getVersionInfoMock.mockReset();
    // Pending by default: the version-only tests below run before any commit arrives.
    getVersionInfoMock.mockReturnValue(new Promise(() => {}));
  });

  it("renders the application name", () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version imported from package.json", () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
  });

  it("renders the app name followed by the version when a version is given", () => {
    render(<AppFooter version="1.2.3" />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v1\.2\.3$/);
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["whitespace", "   "],
  ])("renders only the app name when the version is %s", (_label, value) => {
    render(<AppFooter version={value} />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });

  describe("build commit", () => {
    it("appends the first 7 characters of the commit once the request succeeds", async () => {
      getVersionInfoMock.mockResolvedValue({ version: "9.9.9", commit: "0123456789ab" });

      render(<AppFooter version="1.2.3" />);

      expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(/^0123456$/);
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v1\.2\.3 \(0123456\)$/,
      );
    });

    it("shows the version alone while the request is pending", () => {
      render(<AppFooter version="1.2.3" />);

      const footer = screen.getByTestId("app-footer");
      expect(footer).toHaveTextContent(/^Task Notes v1\.2\.3$/);
      expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
      expect(footer).not.toHaveTextContent("undefined");
      expect(footer).not.toHaveTextContent("(");
    });

    it("shows the version alone when the request fails", async () => {
      getVersionInfoMock.mockRejectedValue(
        new Error("Loading the version failed: 500 Internal Server Error"),
      );

      render(<AppFooter version="1.2.3" />);
      await waitFor(() => expect(getVersionInfoMock).toHaveBeenCalledTimes(1));
      // Let the rejection handler run before asserting that nothing changed.
      await Promise.resolve();

      const footer = screen.getByTestId("app-footer");
      expect(footer).toHaveTextContent(/^Task Notes v1\.2\.3$/);
      expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
      expect(footer).not.toHaveTextContent("undefined");
      expect(footer).not.toHaveTextContent("failed");
    });

    it("shows the version alone when the commit is blank", async () => {
      getVersionInfoMock.mockResolvedValue({ version: "9.9.9", commit: "   " });

      render(<AppFooter version="1.2.3" />);
      await waitFor(() => expect(getVersionInfoMock).toHaveBeenCalledTimes(1));
      await Promise.resolve();

      expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v1\.2\.3$/);
      expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    });

    it("shows a commit shorter than 7 characters as it is", async () => {
      getVersionInfoMock.mockResolvedValue({ version: "9.9.9", commit: "abc" });

      render(<AppFooter version="1.2.3" />);

      expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(/^abc$/);
      expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v1\.2\.3 \(abc\)$/);
    });
  });
});
