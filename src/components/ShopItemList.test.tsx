import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";
import ShopItemList from "./ShopItemList";
import type { PurchaseData } from "../types";

vi.mock("./ShopItem", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: PurchaseData;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid={`shop-item-${value.PK}`}>
      <span>{value.description}</span>
      <input
        type="checkbox"
        aria-label={`checkbox-${value.PK}`}
        onChange={onChange}
      />
    </div>
  ),
}));

const mockItems: PurchaseData[] = [
  {
    PK: "item#1",
    SK: "#meta#1",
    type: "item",
    imagefile: "apple.png",
    username: "testuser",
    description: "Apple",
    price: 100,
    isInCart: 0,
    isPurchased: 0,
    index: 1,
    check: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    PK: "item#2",
    SK: "#meta#2",
    type: "item",
    imagefile: "banana.png",
    username: "testuser",
    description: "Banana",
    price: 200,
    isInCart: 1,
    isPurchased: 0,
    index: 2,
    check: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("ShopItemList", () => {
  it("currentItems の件数分だけ ShopItem を描画し、onChange イベントを親に伝播する", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ShopItemList currentItems={mockItems} onChange={handleChange} />
    );

    expect(screen.getByTestId("shop-item-item#1")).toBeInTheDocument();
    expect(screen.getByTestId("shop-item-item#2")).toBeInTheDocument();
    expect(container.querySelector(".Item1")).toBeInTheDocument();
    expect(container.querySelector(".Item2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("checkbox-item#1"));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("currentItems が空配列の場合は何も描画しない", () => {
    const { container } = render(
      <ShopItemList currentItems={[]} onChange={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});
