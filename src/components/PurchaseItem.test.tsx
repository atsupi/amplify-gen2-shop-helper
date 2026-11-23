import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseItem from "./PurchaseItem";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

vi.mock("../Utils", () => ({
  listPurchaseItems: vi.fn(),
  fetchItem: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

const basePurchase: PurchaseData = {
  PK: "purchase#12345",
  SK: "#meta#12345",
  type: "purchase",
  imagefile: "",
  username: "testuser",
  description: "",
  price: 0,
  isInCart: 0,
  isPurchased: 0,
  index: 1,
  check: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("PurchaseItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("全明細が購入済みの場合は COMPLETED と合計金額・件数・代表商品画像を表示する", async () => {
    vi.mocked(Utils.listPurchaseItems).mockResolvedValue({
      data: {
        listPurchaseTables: {
          items: [
            { type: "purchase", PK: "purchase#12345", SK: "#meta#12345", price: 0, isPurchased: 0 },
            { type: "pitem", PK: "purchase#12345", SK: "item#10", price: 300, isPurchased: 1 },
            { type: "pitem", PK: "purchase#12345", SK: "item#20", price: 500, isPurchased: 1 },
          ],
        },
      },
    } as never);
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: { getPurchaseTable: { imagefile: "top-item.png" } },
    } as never);
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");

    const { container } = render(<PurchaseItem data={basePurchase} />);

    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(await screen.findByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("2 item(s)")).toBeInTheDocument();
    expect(screen.getByText("Total price: 800 JPY")).toBeInTheDocument();

    expect(Utils.fetchItem).toHaveBeenCalledWith("item#10", "#meta#10");
    expect(Utils.getPresignedUrl).toHaveBeenCalledWith("top-item.png");

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com");
  });

  it("未購入の明細が含まれる場合は IN PROGRESS を表示し、画像キーがなければ getPresignedUrl を呼ばない", async () => {
    vi.mocked(Utils.listPurchaseItems).mockResolvedValue({
      data: {
        listPurchaseTables: {
          items: [
            { type: "pitem", PK: "purchase#12345", SK: "item#10", price: 400, isPurchased: 1 },
            { type: "pitem", PK: "purchase#12345", SK: "item#20", price: null, isPurchased: 0 },
          ],
        },
      },
    } as never);
    vi.mocked(Utils.fetchItem).mockResolvedValue({
      data: { getPurchaseTable: { imagefile: null } },
    } as never);

    render(<PurchaseItem data={basePurchase} />);

    expect(await screen.findByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("2 item(s)")).toBeInTheDocument();
    expect(screen.getByText("Total price: 400 JPY")).toBeInTheDocument();
    expect(Utils.getPresignedUrl).not.toHaveBeenCalled();
  });

  it("明細が0件の場合は 0 item(s) と IN PROGRESS を表示し fetchItem を呼ばない", async () => {
    vi.mocked(Utils.listPurchaseItems).mockResolvedValue({
      data: { listPurchaseTables: { items: [] } },
    } as never);

    render(<PurchaseItem data={basePurchase} />);

    await waitFor(() => {
      expect(Utils.listPurchaseItems).toHaveBeenCalledWith("purchase#12345");
    });
    expect(screen.getByText("0 item(s)")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(Utils.fetchItem).not.toHaveBeenCalled();
  });

  it("listPurchaseItems がエラーを投げた場合でもクラッシュせず console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listPurchaseItems).mockRejectedValue(new Error("Fetch failed"));

    render(<PurchaseItem data={basePurchase} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
