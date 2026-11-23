import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseList from "./PurchaseList";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

vi.mock("../Utils", () => ({
  listItems: vi.fn(),
}));

vi.mock("../components/PurchaseItem", () => ({
  default: ({ data }: { data: PurchaseData }) => (
    <div data-testid={`purchase-item-${data.PK}`}>{data.PK}</div>
  ),
}));

const mockPurchases = [
  {
    PK: "purchase#100",
    SK: "#meta#100",
    type: "purchase",
    username: "testuser",
    price: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    PK: "purchase#200",
    SK: "#meta#200",
    type: "purchase",
    username: "testuser",
    price: 0,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

describe("PurchaseList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("購入履歴を取得して一覧表示し、各詳細ページへのリンクを生成する", async () => {
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: {
        purchaseTableByType: {
          items: mockPurchases,
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <PurchaseList />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Purchase List" })).toBeInTheDocument();

    expect(await screen.findByTestId("purchase-item-purchase#100")).toBeInTheDocument();
    expect(screen.getByTestId("purchase-item-purchase#200")).toBeInTheDocument();
    expect(Utils.listItems).toHaveBeenCalledWith("purchase");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/detail/1");
    expect(links[1]).toHaveAttribute("href", "/detail/2");
  });

  it("購入履歴が空の場合はアイテムリンクを表示しない", async () => {
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: {
        purchaseTableByType: {
          items: [],
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <PurchaseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(Utils.listItems).toHaveBeenCalledWith("purchase");
    });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
