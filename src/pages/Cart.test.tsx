import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cart from "./Cart";
import * as Utils from "../Utils";

const { createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    models: {
      PurchaseTable: {
        create: createMock,
        update: updateMock,
      },
    },
  }),
}));

vi.mock("../hooks/useUser", () => ({
  useUser: () => ({ username: "testuser" }),
}));

vi.mock("../Utils", () => ({
  listItemsInCart: vi.fn(),
  fetchItem: vi.fn(),
  updateItemStatus: vi.fn(),
}));

vi.mock("../components/CartItem", () => ({
  default: ({
    PK,
    SK,
    onDelete,
  }: {
    PK: string;
    SK: string;
    onDelete: (item: { PK: string; SK: string }) => void;
  }) => (
    <div data-testid={`cart-item-${PK}`}>
      <span>{PK}</span>
      <button type="button" onClick={() => onDelete({ PK, SK })}>
        MockDelete-{PK}
      </button>
    </div>
  ),
}));

const mockCartItems = [
  {
    id: "1",
    PK: "item#1",
    SK: "#meta#1",
    type: "item",
    imagefile: "apple.png",
    price: 150,
    username: "testuser",
    description: "Apple",
    isInCart: 1,
    isPurchased: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    PK: "item#2",
    SK: "#meta#2",
    type: "item",
    imagefile: null,
    price: null,
    username: null,
    description: "Banana",
    isInCart: 1,
    isPurchased: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("Cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カートが空の場合は Submit ボタンが disabled になる", async () => {
    vi.mocked(Utils.listItemsInCart).mockResolvedValue({
      data: { purchaseTableByIsInCart: { items: [] } },
    } as never);

    render(<Cart />);

    await waitFor(() => {
      expect(Utils.listItemsInCart).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("カート内商品を表示し、Submit で購入レコード・明細作成とカート空化を行う", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(Utils.listItemsInCart).mockResolvedValue({
      data: { purchaseTableByIsInCart: { items: mockCartItems } },
    } as never);
    createMock.mockResolvedValue({ data: { PK: "purchase#1" }, errors: undefined });
    updateMock.mockResolvedValue({ data: {} });

    render(<Cart />);

    expect(await screen.findByTestId("cart-item-item#1")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-item#2")).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      // 親レコード1件 + 明細2件 = 計3回の create 呼び出し
      expect(createMock).toHaveBeenCalledTimes(3);
      expect(updateMock).toHaveBeenCalledTimes(2);
      expect(alertSpy).toHaveBeenCalledWith("Purchase completed!");
    });

    // 完了後にリストが空になりボタンが再び disabled になる
    expect(screen.queryByTestId("cart-item-item#1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    alertSpy.mockRestore();
  });

  it("CartItem の削除操作でリストから除外し DB のカートフラグをオフにする", async () => {
    vi.mocked(Utils.listItemsInCart).mockResolvedValue({
      data: { purchaseTableByIsInCart: { items: [mockCartItems[0]] } },
    } as never);
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: { getPurchaseTable: mockCartItems[0] },
    } as never);
    vi.mocked(Utils.updateItemStatus).mockResolvedValue({} as never);

    render(<Cart />);

    expect(await screen.findByTestId("cart-item-item#1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "MockDelete-item#1" }));

    await waitFor(() => {
      expect(screen.queryByTestId("cart-item-item#1")).not.toBeInTheDocument();
      expect(Utils.fetchItem).toHaveBeenCalledWith("item#1", "#meta#1");
      expect(Utils.updateItemStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          PK: "item#1",
          SK: "#meta#1",
          isInCart: 0,
        })
      );
    });
  });

  it("listItemsInCart や Submit 処理でエラーが発生してもクラッシュせずハンドリングする", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItemsInCart).mockResolvedValue({
      data: { purchaseTableByIsInCart: { items: [mockCartItems[0]] } },
    } as never);
    createMock.mockResolvedValue({
      data: null,
      errors: [{ message: "Create failed" }],
    });

    render(<Cart />);

    const submitButton = await screen.findByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    });

    consoleSpy.mockRestore();
  });
});
