import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartItem from "./CartItem";
import * as Utils from "../Utils";

vi.mock("../Utils", () => ({
  fetchItem: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

describe("CartItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("アイテムデータと署名付き画像URLを取得して描画し、Deleteボタンで onDelete を呼ぶ", async () => {
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: {
        getPurchaseTable: {
          PK: "item#1",
          SK: "#meta#1",
          type: "item",
          imagefile: "banana.png",
          username: "testuser",
          description: "Sweet Banana",
          price: 200,
          isInCart: 1,
          isPurchased: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    } as never);
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");

    const handleDelete = vi.fn();
    render(<CartItem PK="item#1" SK="#meta#1" onDelete={handleDelete} />);

    expect(await screen.findByText("Sweet Banana")).toBeInTheDocument();
    expect(screen.getByText("200 JPY")).toBeInTheDocument();

    const img = await screen.findByRole("img", { name: "Cart item" });
    expect(img).toHaveAttribute("src", "https://example.com");
    expect(Utils.fetchItem).toHaveBeenCalledWith("item#1", "#meta#1");
    expect(Utils.getPresignedUrl).toHaveBeenCalledWith("banana.png");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(handleDelete).toHaveBeenCalledWith({ PK: "item#1", SK: "#meta#1" });
  });

  it("imagefile が空または null の場合は画像を表示せず getPresignedUrl を呼ばない", async () => {
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: {
        getPurchaseTable: {
          PK: "item#2",
          SK: "#meta#2",
          type: "item",
          imagefile: null,
          username: null,
          description: null,
          price: null,
          isInCart: null,
          isPurchased: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    } as never);

    render(<CartItem PK="item#2" SK="#meta#2" onDelete={vi.fn()} />);

    expect(await screen.findByText("0 JPY")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(Utils.getPresignedUrl).not.toHaveBeenCalled();
  });

  it("getPurchaseTable が null を返した場合は何も描画せず onDelete も発火しない", async () => {
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: { getPurchaseTable: null },
    } as never);

    const handleDelete = vi.fn();
    render(<CartItem PK="item#99" SK="#meta#99" onDelete={handleDelete} />);

    await waitFor(() => {
      expect(Utils.fetchItem).toHaveBeenCalledWith("item#99", "#meta#99");
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(handleDelete).not.toHaveBeenCalled();
  });

  it("PK または SK が空文字の場合は fetchItem を呼び出さない", () => {
    render(<CartItem PK="" SK="" onDelete={vi.fn()} />);

    expect(Utils.fetchItem).not.toHaveBeenCalled();
  });

  it("fetchItem がエラーを投げた場合でもクラッシュせず console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.fetchItem).mockRejectedValue(new Error("Network error"));

    render(<CartItem PK="item#1" SK="#meta#1" onDelete={vi.fn()} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
