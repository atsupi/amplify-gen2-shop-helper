import { useEffect, useState } from "react";
import "./PurchaseItem.css";
import {
  fetchItem,
  getPresignedUrl,
  listPurchaseItems,
} from "../Utils";
import type { PurchaseData } from "../types";

type Props = {
  data: PurchaseData;
};

function PurchaseItem(props: Props) {
  const [imagefile, setImageFile] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [numberOfItems, setNumberOfItems] = useState(0);
  const purchaseIndex: PurchaseData = props.data;

  useEffect(() => {
    let cancelled = false;

    const loadPurchase = async () => {
      try {
        const records = (
          await listPurchaseItems(purchaseIndex.PK)
        ).data.listPurchaseTables.items;
        const items = records.filter((item) => item.type === "pitem");

        if (cancelled) return;

        setTotalPrice(
          items.reduce((total, item) => total + (item.price ?? 0), 0)
        );
        setNumberOfItems(items.length);
        setCompleted(
          items.length > 0 && items.every((item) => item.isPurchased === 1)
        );

        const itemId = items[0]?.SK?.split("#")[1];
        if (!itemId) {
          setImageFile("");
          return;
        }

        const product = (await fetchItem(`item#${itemId}`, `#meta#${itemId}`))
          .data.getPurchaseTable;
        const imageKey = product?.imagefile;
        if (imageKey) {
          const imageUrl = await getPresignedUrl(imageKey);
          if (!cancelled) setImageFile(imageUrl);
        } else if (!cancelled) {
          setImageFile("");
        }
      } catch (error) {
        console.error("Failed to load purchase summary:", error);
      }
    };

    void loadPurchase();
    return () => {
      cancelled = true;
    };
  }, [purchaseIndex.PK]);

  return (
    <>
      <div className="PurchaseItem_div">
        <div>{purchaseIndex.PK?.split("#")[1]}</div>
        <p>{numberOfItems} item(s)</p>
        {completed ? (
          <div style={{ color: "white", background: "blue", margin: "15pt" }}>
            COMPLETED
          </div>
        ) : (
          <div style={{ color: "white", background: "orange", margin: "15pt" }}>
            IN PROGRESS
          </div>
        )}
        <img src={imagefile} width="60" height="80" />
        <br />
        <br />
        <p>Total price: {totalPrice} JPY</p>
      </div>
    </>
  );
}

export default PurchaseItem;
