import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";
import DetailList from "./DetailList";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

vi.mock("../Utils", () => ({
  listItems: vi.fn(),
  listPurchaseItems: vi.fn(),
  fetchItem: vi.fn(),
  mutatePurchase: vi.fn(),
}));

vi.mock("./DetailItem", () => ({
  default: ({
    item,
    onChange,
  }: {
    item: PurchaseData;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid={`detail-item-${item.id}`}>
      <span>{item.description}</span>
      <input
        type="checkbox"
        aria-label={`${item.index}`}
        defaultChecked={item.isPurchased === 1}
        onChange={onChange}
      />
    </div>
  ),
}));

describe("DetailList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("指定した pindex の購入明細と商品情報を取得して描画し、チェック操作で mutatePurchase を呼ぶ", async () => {
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: {
        purchaseTableByType: {
          items: [
            { PK: "purchase#10", SK: "#meta#10" },
            { PK: "purchase#20", SK: "#meta#20" },
          ],
        },
      },
    } as never);

    vi.mocked(Utils.listPurchaseItems).mockResolvedValue({
      data: {
        listPurchaseTables: {
          items: [
            { type: "purchase", PK: "purchase#20", SK: "#meta#20" },
            { type: "pitem", PK: "purchase#20", SK: "item#101", isPurchased: 0 },
            { type: "pitem", PK: "purchase#20", SK: "item#102", isPurchased: 1 },
          ],
        },
      },
    } as never);

    vi.mocked(Utils.fetchItem)
      .mockResolvedValueOnce({
        data: {
          getPurchaseTable: {
            id: "prod-101",
            PK: "item#101",
            SK: "#meta#101",
            type: "item",
            imagefile: "peach.png",
            username: "testuser",
            description: "Fresh Peach",
            price: 400,
            isInCart: 0,
            isPurchased: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          getPurchaseTable: {
            id: "prod-102",
            PK: "item#102",
            SK: "#meta#102",
            type: "item",
            imagefile: null,
            username: null,
            description: "Sweet Grape",
            price: 600,
            isInCart: 0,
            isPurchased: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      } as never);

    vi.mocked(Utils.mutatePurchase).mockResolvedValue({} as never);

    render(<DetailList pindex={2} />);

    expect(await screen.findByText("Fresh Peach")).toBeInTheDocument();
    expect(screen.getByText("Sweet Grape")).toBeInTheDocument();
    expect(Utils.listPurchaseItems).toHaveBeenCalledWith("purchase#20");
    expect(Utils.fetchItem).toHaveBeenCalledWith("item#101", "#meta#101");
    expect(Utils.fetchItem).toHaveBeenCalledWith("item#102", "#meta#102");

    // 1つ目のアイテム（isPurchased: 0 → 1）をチェック
    const firstCheckbox = screen.getByRole("checkbox", { name: "0" });
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(Utils.mutatePurchase).toHaveBeenCalledWith({
        PK: "purchase#20",
        SK: "item#101",
        isPurchased: 1,
      });
    });

    // 2つ目のアイテム（isPurchased: 1 → 0）をチェック解除
    const secondCheckbox = screen.getByRole("checkbox", { name: "1" });
    fireEvent.click(secondCheckbox);

    await waitFor(() => {
      expect(Utils.mutatePurchase).toHaveBeenCalledWith({
        PK: "purchase#20",
        SK: "item#102",
        isPurchased: 0,
      });
    });
  });

  it("指定した pindex に該当する購入レコードが存在しない場合は何も表示しない", async () => {
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: {
        purchaseTableByType: {
          items: [{ PK: "purchase#10", SK: "#meta#10" }],
        },
      },
    } as never);

    const { container } = render(<DetailList pindex={5} />);

    await waitFor(() => {
      expect(Utils.listItems).toHaveBeenCalledWith("purchase");
    });
    expect(Utils.listPurchaseItems).not.toHaveBeenCalled();
    expect(container.querySelector(".DetailItem_wrapper")).toBeNull();
  });

  it("mutatePurchase が失敗した場合でもクラッシュせず console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: { purchaseTableByType: { items: [{ PK: "purchase#10", SK: "#meta#10" }] } },
    } as never);
    vi.mocked(Utils.listPurchaseItems).mockResolvedValue({
      data: {
        listPurchaseTables: {
          items: [{ type: "pitem", PK: "purchase#10", SK: "item#101", isPurchased: 0 }],
        },
      },
    } as never);
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: {
        getPurchaseTable: {
          id: "prod-101",
          PK: "item#101",
          SK: "#meta#101",
          type: "item",
          description: "Apple",
          price: 100,
        },
      },
    } as never);
    vi.mocked(Utils.mutatePurchase).mockRejectedValue(new Error("Mutate failed"));

    render(<DetailList pindex={1} />);
    const checkbox = await screen.findByRole("checkbox", { name: "0" });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
  it("listItems がエラーを投げた場合でもクラッシュせず console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItems).mockRejectedValue(new Error("List error"));

    render(<DetailList pindex={1} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });  
});
