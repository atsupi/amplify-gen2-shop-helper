import { useEffect, useState } from "react";
import "./CartItem.css";
import { PurchaseData } from "../types";
import { fetchItem, getPresignedUrl } from "../Utils";
import { Button } from "@aws-amplify/ui-react";
import { updateItemStatus } from "../Utils";

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
      fetchItem(props.PK, props.SK).then((res) => {
        const newItem: PurchaseData = { ...res.data.getPurchaseTable, id: res.data.getPurchaseTable.id?? "", imagefile: res.data.getPurchaseTable.imagefile?? "", username: res.data.getPurchaseTable.username?? "", description: res.data.getPurchaseTable.description?? "", price: res.data.getPurchaseTable.price?? 0, isInCart: res.data.getPurchaseTable.isInCart?? 0, isPurchased: res.data.getPurchaseTable.isPurchased?? 0, index: 0, check: 0 }; 
        setCurItem(newItem);
        getPresignedUrl(res.data.getPurchaseTable?.imagefile || "").then((url) => {
          setPresignedUrl(url);
        });
      });
    }
  }, []);

  const deleteCurrentItem = () => {
    if (!curItem) return;

    updateItemStatus({
      PK: curItem.PK,
      SK: curItem.SK,
      isInCart: 0,
    });

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
