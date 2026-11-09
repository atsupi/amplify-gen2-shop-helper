import { useEffect, useState } from "react";
import "./CartItem.css";
import { PurchaseData } from "../types";
import { fetchItem, getPresignedUrl } from "../Utils";
import { Button } from "@aws-amplify/ui-react";

type Props = {
  PK: string;
  SK: string;
  onDelete: (item: { PK: string; SK: string }) => void;
};

function CartItem( props: Props ) {
  const [curItem, setCurItem] = useState<PurchaseData>();
  const [presignedUrl, setPresignedUrl] = useState("");

  useEffect(() => {
    if (props.PK && props.SK) {
      void fetchItem(props.PK, props.SK)
        .then(async (res) => {
          const item = res.data.getPurchaseTable;
          if (!item) return;

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
            setPresignedUrl(await getPresignedUrl(item.imagefile));
          }
        })
        .catch((error) => {
          console.error("Failed to load cart item:", error);
        });
    }
  }, []);

  const deleteCurrentItem = () => {
    if (!curItem) return;

    props.onDelete({ PK: curItem.PK, SK: curItem.SK });
  };

  return (
    <>
      <div className="CartItem_div">
        {presignedUrl !== "" && (
          <img src={presignedUrl} width="60" height="80" />
        )}
        <div className="CartItem_description">{curItem?.description}</div>
        <div className="CartItem_price">{curItem?.price} JPY</div>
        <div className="DeleteButton">
          <Button onClick={deleteCurrentItem}>Delete</Button>
        </div>
      </div>
    </>
  );
}

export default CartItem;
