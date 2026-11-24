import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Shop from "./Shop";
import * as Utils from "../Utils";
import type { PurchaseData } from "../types";

const { unsubscribeMock, subscribeMock } = vi.hoisted(() => ({
  unsubscribeMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    models: {
      PurchaseTable: {
        onCreate: () => ({
          subscribe: subscribeMock,
        }),
      },
    },
  }),
}));

vi.mock("../Utils", () => ({
  listItems: vi.fn(),
}));

vi.mock("../components/PaginateItems", () => ({
  default: ({
    items,
    onChange,
  }: {
    items: PurchaseData[];
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid="paginate-items">
      <span>itemsCount: {items.length}</span>
      <input
        type="checkbox"
        aria-label="mock-item-checkbox"
        onChange={onChange}
      />
    </div>
  ),
}));

describe("Shop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeMock.mockImplementation((handlers?: { next?: (e: unknown) => void; error?: (e: unknown) => void }) => {
      handlers?.next?.({ PK: "item#new" });
      handlers?.error?.(new Error("Subscription mock error"));
      return { unsubscribe: unsubscribeMock };
    });
  });

  it("商品一覧を取得してカート内件数を集計し、チェック操作で件数を増減できる", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: {
        purchaseTableByType: {
          items: [
            {
              PK: "item#1",
              SK: "#meta#1",
              type: "item",
              imagefile: "apple.png",
              username: "user1",
              description: "Apple",
              price: 100,
              isInCart: 1,
              isPurchased: 0,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
            {
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
          ],
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    );

    expect(await screen.findByText("To Cart (1)")).toBeInTheDocument();
    expect(screen.getByText("itemsCount: 2")).toBeInTheDocument();
    expect(Utils.listItems).toHaveBeenCalledWith("item");

    const checkbox = screen.getByLabelText("mock-item-checkbox");
    fireEvent.click(checkbox);
    expect(screen.getByText("To Cart (2)")).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(screen.getByText("To Cart (1)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /To Cart/ }));
    consoleSpy.mockRestore();
  });

  it("アンマウント時にサブスクリプションが解除される", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItems).mockResolvedValue({
      data: { purchaseTableByType: { items: [] } },
    } as never);

    const { unmount } = render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(Utils.listItems).toHaveBeenCalled();
    });

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("listItems がエラーを投げた場合でもクラッシュせず console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Utils.listItems).mockRejectedValue(new Error("API error"));

    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
