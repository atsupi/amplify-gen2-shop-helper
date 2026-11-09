import "./ShopItem.css";
import { useEffect, useState, type ChangeEvent } from "react";
import { Checkbox } from "@mui/material";
import { getPresignedUrl, updateItemStatus } from "../Utils";
import type { PurchaseData } from "../types";

type Props = {
  value: PurchaseData;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function ShopItem(props: Props) {
  const [imageName, setImageName] = useState("");
  const [isInCart, setIsInCart] = useState(props.value.isInCart === 1);

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      if (!props.value.imagefile) {
        setImageName("");
        return;
      }

      try {
        const result = await getPresignedUrl(props.value.imagefile);
        if (!cancelled) setImageName(result);
      } catch (error) {
        console.error("Failed to load product image:", error);
      }
    };

    void loadImage();
    return () => {
      cancelled = true;
    };
  }, [props.value.imagefile]);

  useEffect(() => {
    setIsInCart(props.value.isInCart === 1);
  }, [props.value.isInCart]);

  const onClickCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    const nextIsInCart = event.target.checked;
    const nextStatus = nextIsInCart ? 1 : 0;
    setIsInCart(nextIsInCart);

    void updateItemStatus({
      PK: props.value.PK,
      SK: props.value.SK,
      isInCart: nextStatus,
    });
    props.onChange(event);
  };

  return (
    <>
      <div className="ShopItem_div">
        <div className="checkbox">
          <Checkbox
            checked={isInCart}
            color="success"
            onChange={onClickCheckbox}
          />
        </div>
        <div className="ShopItem_productImage">
          {imageName ? (
            <img src={imageName} width="60" height="80" alt="Product" />
          ) : (
            <div className="NoImage">No image</div>
          )}
        </div>
        <div className="ShopItem_description">{props.value.description}</div>
        <div className="ShopItem_price">{props.value.price} JPY</div>
      </div>
    </>
  );
}

export default ShopItem;
