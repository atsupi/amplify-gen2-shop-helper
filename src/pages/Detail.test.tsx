import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Detail from "./Detail";

vi.mock("../components/DetailList", () => ({
  default: ({ pindex }: { pindex: number }) => (
    <div data-testid="detail-list">pindex: {pindex}</div>
  ),
}));

describe("Detail", () => {
  it("URLパラメータの id を数値として DetailList に渡す", () => {
    render(
      <MemoryRouter initialEntries={["/detail/3"]}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("detail-list")).toHaveTextContent("pindex: 3");
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/purchase");
  });

  it("不正な id パラメータの場合はデフォルト値 1 にフォールバックする", () => {
    render(
      <MemoryRouter initialEntries={["/detail/invalid"]}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("detail-list")).toHaveTextContent("pindex: 1");
  });
});
