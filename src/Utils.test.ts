import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUrl: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  purchaseTableByType: vi.fn(),
  purchaseTableByIsInCart: vi.fn(),
  update: vi.fn(),
}));

vi.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    models: {
      PurchaseTable: {
        list: mocks.list,
        get: mocks.get,
        purchaseTableByType: mocks.purchaseTableByType,
        purchaseTableByIsInCart: mocks.purchaseTableByIsInCart,
        update: mocks.update,
      },
    },
  }),
}));

vi.mock("aws-amplify/storage", () => ({
  getUrl: mocks.getUrl,
}));

import {
  fetchItem,
  fetchPurchases,
  getList,
  getPresignedUrl,
  listItems,
  listItemsInCart,
  listPurchaseItems,
  mutatePurchase,
  updateItemStatus,
} from "./Utils";

const item = {
  PK: "user-1",
  SK: "item-1",
  type: "book",
};

const apiErrors = [{ message: "Request failed" }];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPresignedUrl", () => {
  it("requests the public object URL and returns it as a string", async () => {
    mocks.getUrl.mockResolvedValue({
      url: { toString: () => "https://example.com/image.jpg" },
    });

    await expect(getPresignedUrl("image.jpg")).resolves.toBe(
      "https://example.com/image.jpg",
    );
    expect(mocks.getUrl).toHaveBeenCalledWith({
      path: "public/image.jpg",
      options: { validateObjectExistence: false },
    });
  });

  it("propagates Storage API errors", async () => {
    const error = new Error("Storage request failed");
    mocks.getUrl.mockRejectedValue(error);

    await expect(getPresignedUrl("image.jpg")).rejects.toBe(error);
  });
});

describe("getList", () => {
  it("requests the next page and wraps the returned items", async () => {
    mocks.list.mockResolvedValue({ data: [item], errors: undefined });

    await expect(getList("next-token")).resolves.toEqual({
      data: { listPurchaseTables: { items: [item] } },
    });
    expect(mocks.list).toHaveBeenCalledWith({ nextToken: "next-token" });
  });

  it("omits a null next token and throws API errors", async () => {
    mocks.list.mockResolvedValueOnce({ data: [], errors: undefined });
    await getList(null);
    expect(mocks.list).toHaveBeenCalledWith({ nextToken: undefined });

    mocks.list.mockResolvedValueOnce({ data: null, errors: apiErrors });
    await expect(getList()).rejects.toThrow(JSON.stringify(apiErrors));
  });
});

describe("fetchItem", () => {
  it("fetches by the composite key and wraps the item", async () => {
    mocks.get.mockResolvedValue({ data: item, errors: undefined });

    await expect(fetchItem("user-1", "item-1")).resolves.toEqual({
      data: { getPurchaseTable: item },
    });
    expect(mocks.get).toHaveBeenCalledWith({ PK: "user-1", SK: "item-1" });
  });

  it("throws API errors", async () => {
    mocks.get.mockResolvedValue({ data: null, errors: apiErrors });

    await expect(fetchItem("user-1", "item-1")).rejects.toThrow(
      JSON.stringify(apiErrors),
    );
  });
});

describe("listItems", () => {
  it("queries by type and wraps the returned items", async () => {
    mocks.purchaseTableByType.mockResolvedValue({
      data: [item],
      errors: undefined,
    });

    await expect(listItems("book")).resolves.toEqual({
      data: { purchaseTableByType: { items: [item] } },
    });
    expect(mocks.purchaseTableByType).toHaveBeenCalledWith({ type: "book" });
  });

  it("throws API errors", async () => {
    mocks.purchaseTableByType.mockResolvedValue({
      data: null,
      errors: apiErrors,
    });

    await expect(listItems("book")).rejects.toThrow(JSON.stringify(apiErrors));
  });
});

describe("listPurchaseItems", () => {
  it("filters by partition key and wraps the returned items", async () => {
    mocks.list.mockResolvedValue({ data: [item], errors: undefined });

    await expect(listPurchaseItems("user-1")).resolves.toEqual({
      data: { listPurchaseTables: { items: [item] } },
    });
    expect(mocks.list).toHaveBeenCalledWith({
      filter: { PK: { eq: "user-1" } },
    });
  });

  it("throws API errors", async () => {
    mocks.list.mockResolvedValue({ data: null, errors: apiErrors });

    await expect(listPurchaseItems("user-1")).rejects.toThrow(
      JSON.stringify(apiErrors),
    );
  });
});

describe("listItemsInCart", () => {
  it("queries items in the cart and wraps the returned items", async () => {
    mocks.purchaseTableByIsInCart.mockResolvedValue({
      data: [item],
      errors: undefined,
    });

    await expect(listItemsInCart()).resolves.toEqual({
      data: { purchaseTableByIsInCart: { items: [item] } },
    });
    expect(mocks.purchaseTableByIsInCart).toHaveBeenCalledWith({ isInCart: 1 });
  });

  it("throws API errors", async () => {
    mocks.purchaseTableByIsInCart.mockResolvedValue({
      data: null,
      errors: apiErrors,
    });

    await expect(listItemsInCart()).rejects.toThrow(JSON.stringify(apiErrors));
  });
});

describe("updateItemStatus", () => {
  it("updates and returns the item", async () => {
    mocks.update.mockResolvedValue({ data: item, errors: undefined });

    await expect(updateItemStatus(item)).resolves.toEqual(item);
    expect(mocks.update).toHaveBeenCalledWith(item);
  });

  it("throws API errors", async () => {
    mocks.update.mockResolvedValue({ data: null, errors: apiErrors });

    await expect(updateItemStatus(item)).rejects.toThrow(
      JSON.stringify(apiErrors),
    );
  });
});

describe("fetchPurchases", () => {
  it("fetches and wraps all purchase items", async () => {
    mocks.list.mockResolvedValue({ data: [item], errors: undefined });

    await expect(fetchPurchases()).resolves.toEqual({
      data: { listPurchaseTables: { items: [item] } },
    });
    expect(mocks.list).toHaveBeenCalledWith();
  });

  it("throws API errors", async () => {
    mocks.list.mockResolvedValue({ data: null, errors: apiErrors });

    await expect(fetchPurchases()).rejects.toThrow(
      JSON.stringify(apiErrors),
    );
  });
});

describe("mutatePurchase", () => {
  it("updates and returns the purchase", async () => {
    mocks.update.mockResolvedValue({ data: item, errors: undefined });

    await expect(mutatePurchase(item)).resolves.toEqual(item);
    expect(mocks.update).toHaveBeenCalledWith(item);
  });

  it("throws API errors", async () => {
    mocks.update.mockResolvedValue({ data: null, errors: apiErrors });

    await expect(mutatePurchase(item)).rejects.toThrow(
      JSON.stringify(apiErrors),
    );
  });
});
