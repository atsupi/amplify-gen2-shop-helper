import type { ChangeEvent } from "react";
import ShopItem from "./ShopItem";
import type { PurchaseData } from "../types";

type Props = {
  currentItems: PurchaseData[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function ShopItemList({ currentItems, onChange }: Props) {
  return (
    <>
      {currentItems &&
        currentItems.map((value: PurchaseData, i: number) => {
          const index = i + 1;
          return (
            <div className={`Item${index}`} key={value.PK || `Item${index}`}>
              <ShopItem value={value} onChange={onChange} />
            </div>
          );
        })}
    </>
  );
}

export default ShopItemList;
