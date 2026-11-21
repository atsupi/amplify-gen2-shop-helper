import { useEffect, useState } from "react";
import "./CartItem.css";
import type { PurchaseData } from "../types";
import { fetchItem, getPresignedUrl } from "../Utils";
import { Button } from "@aws-amplify/ui-react";

type Props = {
  PK: string;
  SK: string;
  onDelete: (item: { PK: string; SK: string }) => void;
};

function CartItem({ PK, SK, onDelete }: Props) {
  const [curItem, setCurItem] = useState<PurchaseData>();
  const [presignedUrl, setPresignedUrl] = useState("");

  useEffect(() => {
    if (!PK || !SK) return;

    let cancelled = false;

    const loadCartItem = async () => {
      try {
        const res = await fetchItem(PK, SK);
        const item = res.data.getPurchaseTable;
        if (!item || cancelled) return;

        setCurItem({
          ...item,
          imagefile: item.imagefile ?? "",
          username: item.username ?? "",
          description: item.description ?? "",
          price: item.price ?? 0,
          isInCart: item.isInCart ?? 0,
          isPurchased: item.isPurchased ?? 0,
          index: 0,
          check: 0,
        });

        if (item.imagefile) {
          const url = await getPresignedUrl(item.imagefile);
          if (!cancelled) {
            setPresignedUrl(url);
          }
        }
      } catch (error) {
        console.error("Failed to load cart item:", error);
      }
    };

    void loadCartItem();

    return () => {
      cancelled = true;
    };
  }, [PK, SK]);

  const deleteCurrentItem = () => {
    if (!curItem) return;

    onDelete({ PK: curItem.PK, SK: curItem.SK });
  };

  return (
    <div className="CartItem_div">
      {presignedUrl !== "" && (
        <img src={presignedUrl} width="60" height="80" alt="Cart item" />
      )}
      <div className="CartItem_description">{curItem?.description}</div>
      <div className="CartItem_price">{curItem?.price} JPY</div>
      <div className="DeleteButton">
        <Button onClick={deleteCurrentItem}>Delete</Button>
      </div>
    </div>
  );
}

export default CartItem;
