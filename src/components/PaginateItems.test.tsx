import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";
import PaginateItems from "./PaginateItems";
import type { PurchaseData } from "../types";

vi.mock("./ShopItemList", () => ({
  default: ({
    currentItems,
    onChange,
  }: {
    currentItems: PurchaseData[];
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid="shop-item-list">
      {currentItems.map((item) => (
        <div key={item.PK}>{item.description}</div>
      ))}
      <input
        type="checkbox"
        aria-label="mock-paginate-checkbox"
        onChange={onChange}
      />
    </div>
  ),
}));

const createMockItems = (count: number): PurchaseData[] =>
  Array.from({ length: count }, (_, i) => ({
    PK: `item#${i + 1}`,
    SK: `#meta#${i + 1}`,
    type: "item",
    imagefile: `img${i + 1}.png`,
    username: "testuser",
    description: `Product ${i + 1}`,
    price: (i + 1) * 100,
    isInCart: 0,
    isPurchased: 0,
    index: i + 1,
    check: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));

describe("PaginateItems", () => {
  it("itemsPerPage ごとにアイテムを分割表示し、ページ切り替えで次のアイテムを表示する", () => {
    const items = createMockItems(5);
    render(<PaginateItems itemsPerPage={2} items={items} onChange={vi.fn()} />);

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.queryByText("Product 3")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
    expect(screen.getByText("Product 4")).toBeInTheDocument();
  });

  it("ShopItemList の onChange イベントを親に伝播する", () => {
    const handleChange = vi.fn();
    render(
      <PaginateItems
        itemsPerPage={2}
        items={createMockItems(2)}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByLabelText("mock-paginate-checkbox"));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
