import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShopItem from "./ShopItem";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

vi.mock("../Utils", () => ({
  getPresignedUrl: vi.fn(),
  updateItemStatus: vi.fn(),
}));

const baseItem: PurchaseData = {
  PK: "item#1",
  SK: "#meta#1",
  type: "item",
  imagefile: "apple.png",
  username: "testuser",
  description: "Fresh Apple",
  price: 150,
  isInCart: 0,
  isPurchased: 0,
  index: 1,
  check: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ShopItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("商品説明・価格・署名付き画像URLが正しく描画される", async () => {
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");

    render(<ShopItem value={baseItem} onChange={vi.fn()} />);

    expect(screen.getByText("Fresh Apple")).toBeInTheDocument();
    expect(screen.getByText("150 JPY")).toBeInTheDocument();

    const img = await screen.findByRole("img", { name: "Product" });
    expect(img).toHaveAttribute("src", "https://example.com");
    expect(Utils.getPresignedUrl).toHaveBeenCalledWith("apple.png");
  });

  it("imagefile が空の場合は No image を表示し getPresignedUrl を呼ばない", () => {
    render(
      <ShopItem
        value={{ ...baseItem, imagefile: "" }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(Utils.getPresignedUrl).not.toHaveBeenCalled();
  });

  it("getPresignedUrl が失敗してもエラーを握りつぶし No image のまま維持する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.getPresignedUrl).mockRejectedValue(new Error("S3 error"));

    render(<ShopItem value={baseItem} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    expect(screen.getByText("No image")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("チェックボックス操作でステータス更新APIを呼び出し onChange を実行する", async () => {
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("");
    vi.mocked(Utils.updateItemStatus).mockResolvedValue({} as never);
    const handleChange = vi.fn();

    render(<ShopItem value={baseItem} onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    await waitFor(() => {
      expect(Utils.updateItemStatus).toHaveBeenCalledWith({
        PK: "item#1",
        SK: "#meta#1",
        isInCart: 1,
      });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  it("ステータス更新APIが失敗した場合はチェック状態を元の状態にロールバックする", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("");
    vi.mocked(Utils.updateItemStatus).mockRejectedValue(new Error("DynamoDB error"));
    const handleChange = vi.fn();

    render(<ShopItem value={baseItem} onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // 楽観的UI更新で一時的に checked になる
    expect(checkbox).toBeChecked();

    // API失敗後にロールバックされる
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
    expect(handleChange).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("親から渡された props.value.isInCart が変化したときチェック状態が同期される", () => {
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("");

    const { rerender } = render(<ShopItem value={baseItem} onChange={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    rerender(<ShopItem value={{ ...baseItem, isInCart: 1 }} onChange={vi.fn()} />);
    expect(checkbox).toBeChecked();
  });
});
