import "./Cart.css";
import { useUser } from "../hooks/useUser";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { type Schema } from "../../amplify/data/resource"; // 💡 パスは環境に合わせて調整してください
import { Button } from "@aws-amplify/ui-react";
import CartItem from "../components/CartItem";
import {
  fetchItem,
  listItemsInCart,
  updateItemStatus,
} from "../Utils";

// クライアントの生成
const client = generateClient<Schema>();

// type（型エイリアス）と交差型（&）を使用する
type ExtendedCartItem = Schema['PurchaseTable']['type'] & {
  index: number;
};

function Cart() {
  const [itemList, setItemList] = useState<ExtendedCartItem[]>([]);
  const { username } = useUser();

  useEffect(() => {
    const loadCartItems = async () => {
      try {
        const res = await listItemsInCart();
        const items = res.data.purchaseTableByIsInCart.items;

        const newItemList: ExtendedCartItem[] = items.map((item, index) => ({
          id: item.id,
          index: index,
          PK: item.PK,
          SK: item.SK,
          type: item.type,
          imagefile: item.imagefile,
          price: item.price,
          username: username || "unknown",
          description: item.description,
          isInCart: item.isInCart,
          isPurchased: 0,
        })) as ExtendedCartItem[];

        setItemList(newItemList);
      } catch (error) {
        console.error("Error loading cart items:", error);
      }
    };

    loadCartItems();
  }, [username]);

  const onSubmit = async () => {
    if (itemList.length < 1) return;

    const purId = new Date().getTime().toString();
    const newPurchase = {
      PK: "purchase#" + purId,
      SK: "#meta#" + purId,
      type: "purchase",
      username: username || "unknown",
    };

    try {
      // 1. 親となる購入レコードの作成
      const purchaseResult = await client.models.PurchaseTable.create(newPurchase);
      if (purchaseResult.errors) throw new Error(JSON.stringify(purchaseResult.errors));
      console.log("Purchase record created:", purchaseResult.data);

      // 2. カート内アイテムの紐付けレコード作成 (Promise.all で並行処理)
      const childPromises = itemList.map(async (item) => {
        const value = {
          PK: "purchase#" + purId,
          SK: item.PK,
          type: "pitem",
          username: username || "unknown",
          isPurchased: 0,
          price: item.price ?? 0,
        };
        const itemResult = await client.models.PurchaseTable.create(value);
        if (itemResult.errors) throw new Error(JSON.stringify(itemResult.errors));
        return itemResult.data;
      });

      await Promise.all(childPromises);
      console.log("All purchase items registered successfully.");
      
      // 必要に応じて決済完了後の画面遷移やカートのクリア処理をここに記述します
    } catch (error) {
      console.error("Checkout submission error:", error);
    }
  };

  const onDeleteChild = async (props: { PK: string; SK: string }) => {
    // 画面上のリストから即時除外
    setItemList((prevList) => prevList.filter((item) => item.PK !== props.PK));

    try {
      // 指定アイテムを取得してインカートフラグを落とす
      const res = await fetchItem(props.PK, props.SK);
      const curItem = res.data.getPurchaseTable;

      if (curItem) {
        const newItem = {
          PK: curItem.PK,
          SK: curItem.SK,
          type: curItem.type,
          imagefile: curItem.imagefile ?? undefined,
          price: curItem.price ?? undefined,
          username: curItem.username ?? undefined,
          description: curItem.description ?? undefined,
          isInCart: 0,
        };
        await updateItemStatus(newItem);
      }
    } catch (error) {
      console.error("Error deleting item from cart:", error);
    }
  };

  return (
    <>
      <div className="Cart_div">
        <Button onClick={onSubmit} disabled={itemList.length < 1}>
          Submit
        </Button>
        <div className="CartItemList">
          {itemList.map((item) => {
            return (
              <div className="Item" key={`Item${item.index}`}>
                <CartItem
                  PK={item.PK}
                  SK={item.SK}
                  onDelete={onDeleteChild}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default Cart;
