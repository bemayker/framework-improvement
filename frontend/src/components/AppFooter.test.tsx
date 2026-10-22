import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version } from "../../package.json";
import { getStamp } from "../api/stamp";

vi.mock("../api/stamp", () => ({
  getStamp: vi.fn(),
}));

const getStampMock = vi.mocked(getStamp);

describe("AppFooter", () => {
  beforeEach(() => {
    getStampMock.mockReset();
    getStampMock.mockResolvedValue({ stamp: "ok", db: true });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(getStampMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version imported from package.json", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(getStampMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(getStampMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });

  it("shows 'stamp: ok' once the stamp resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-stamp")).toHaveTextContent(
      "stamp: ok",
    );
    expect(getStampMock).toHaveBeenCalledTimes(1);
  });

  it("shows no stamp before the request resolves", () => {
    getStampMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.queryByTestId("app-footer-stamp")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("shows no stamp and keeps the name and version when the request fails", async () => {
    getStampMock.mockRejectedValue(new Error("Loading the stamp failed: 500"));

    render(<AppFooter />);
    await waitFor(() => expect(getStampMock).toHaveBeenCalledTimes(1));

    expect(screen.queryByTestId("app-footer-stamp")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      `Task Notes v${version}`,
    );
  });
});
