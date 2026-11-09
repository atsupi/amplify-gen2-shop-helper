import { useEffect, useState } from "react";
import "./DetailList.css";
import type { PurchaseData } from "../types";
import {
  fetchItem,
  listItems,
  listPurchaseItems,
  mutatePurchase,
} from "../Utils";
import DetailItem from "./DetailItem";

type Props = {
  pindex: number;
};

function DetailList(props: Props) {
  const [items, setItems] = useState<PurchaseData[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseData[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      try {
        const purchases = (await listItems("purchase")).data.purchaseTableByType.items;
        const purchase = purchases[props.pindex - 1];
        if (!purchase?.PK) {
          setItems([]);
          setPurchaseItems([]);
          return;
        }

        const purchaseRecords = (
          await listPurchaseItems(purchase.PK)
        ).data.listPurchaseTables.items.filter((item) => item.type === "pitem");

        const results = await Promise.all(
          purchaseRecords.map(async (purchaseItem) => {
            const itemId = purchaseItem.SK?.split("#")[1];
            if (!itemId) return null;

            const result = await fetchItem(`item#${itemId}`, `#meta#${itemId}`);
            const item = result.data.getPurchaseTable;
            if (!item) return null;

            return {
              purchaseItem,
              item: {
                ...item,
                imagefile: item.imagefile ?? "",
                username: item.username ?? "",
                description: item.description ?? "",
                price: item.price ?? 0,
                isInCart: item.isInCart ?? 0,
                isPurchased: purchaseItem.isPurchased ?? 0,
              },
            };
          })
        );
        const loaded = results.filter(
          (result): result is NonNullable<typeof result> => result !== null
        );
        const loadedItems = loaded.map(({ item }, index) => ({ ...item, index }));

        if (!cancelled) {
          setItems(loadedItems);
          setPurchaseItems(loaded.map(({ purchaseItem }) => purchaseItem));
        }
      } catch (error) {
        console.error("Failed to load purchase details:", error);
      }
    };

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [props.pindex]);

  const onChangeCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(event.target.getAttribute("aria-label"));
    const purchaseItem = purchaseItems[index];
    if (!Number.isInteger(index) || !purchaseItem) return;

    const isPurchased = purchaseItem.isPurchased === 1 ? 0 : 1;
    setPurchaseItems((previousItems) =>
      previousItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, isPurchased } : item
      )
    );
    void mutatePurchase({
      PK: purchaseItem.PK,
      SK: purchaseItem.SK,
      isPurchased,
    }).catch((error) => {
      console.error("Failed to update purchase status:", error);
    });
  };

  return (
    <>
      <div className="DetailList_wrapper">
        {items.map((item) => {
          return (
            <div className="DetailItem_wrapper" key={item.id}>
              <DetailItem item={item} onChange={onChangeCheckbox} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export default DetailList;
