import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DetailItem from "./DetailItem";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

vi.mock("../Utils", () => ({
  getPresignedUrl: vi.fn(),
}));

const baseItem: PurchaseData = {
  id: "detail-1",
  PK: "purchase#1",
  SK: "item#1",
  type: "pitem",
  imagefile: "melon.png",
  username: "testuser",
  description: "Sweet Melon",
  price: 1200,
  isInCart: 0,
  isPurchased: 0,
  index: 1,
  check: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("DetailItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("アイテム情報と署名付き画像URLを描画し、チェックボックス操作で onChange を呼ぶ", async () => {
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");
    const handleChange = vi.fn();

    const { container } = render(
      <DetailItem item={baseItem} onChange={handleChange} />
    );

    expect(screen.getByText("Sweet Melon")).toBeInTheDocument();
    expect(screen.getByText("1200 JPY")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", { name: "1" });
    expect(checkbox).not.toBeChecked();

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    await vi.waitFor(() => {
      expect(img).toHaveAttribute("src", "https://example.com");
    });
    expect(Utils.getPresignedUrl).toHaveBeenCalledWith("melon.png");

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("isPurchased が 1 の場合は初期状態でチェック済みになり、imagefile が null の場合は空文字を渡す", async () => {
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("");

    render(
      <DetailItem
        item={{ ...baseItem, isPurchased: 1, imagefile: null }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: "1" })).toBeChecked();
    await vi.waitFor(() => {
      expect(Utils.getPresignedUrl).toHaveBeenCalledWith("");
    });
  });
});
