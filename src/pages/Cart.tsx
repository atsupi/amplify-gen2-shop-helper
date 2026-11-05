import "./Cart.css";
import { useUser } from "../hooks/useUser";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { type Schema } from "../../amplify/data/resource"; 
import { Button } from "@aws-amplify/ui-react";
import CartItem from "../components/CartItem";
import {
  fetchItem,
  listItemsInCart,
  updateItemStatus,
} from "../Utils";

const client = generateClient<Schema>();

type ExtendedCartItem = Schema['PurchaseTable']['type'] & {
  index: number;
};

function Cart() {
  const [itemList, setItemList] = useState<ExtendedCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // 💡 連打・二重送信防止用
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
    if (itemList.length < 1 || isSubmitting) return;

    setIsSubmitting(true); // 送信ロック
    const purId = new Date().getTime().toString();
    const newPurchase = {
      PK: "purchase#" + purId,
      SK: "#meta#" + purId,
      type: "purchase",
      username: username || "unknown",
      price: 0, // 👈 親レコード自体が価格を持たない（または0）ことを明示
    };

    try {
      // 1. 親となる購入レコードの作成
      const purchaseResult = await client.models.PurchaseTable.create(newPurchase);
      if (purchaseResult.errors) throw new Error(JSON.stringify(purchaseResult.errors));

      // 2. 明細作成とフラグ更新
      const childPromises = itemList.map(async (item) => {
        // 💡 修正：まず元の商品のカートフラグを確実にオフにする
        const updateItemValue = {
          PK: item.PK,
          SK: item.SK,
          isInCart: 0,       
          isPurchased: 0,
        };
        await client.models.PurchaseTable.update(updateItemValue);

        // その後、購入明細レコードを作成する
        const pitemValue = {
          PK: "purchase#" + purId,
          SK: item.PK,
          type: "pitem",
          username: username || "unknown",
          isPurchased: 0, 
          price: item.price ?? 0,
        };
        const itemResult = await client.models.PurchaseTable.create(pitemValue);
        if (itemResult.errors) throw new Error(JSON.stringify(itemResult.errors));

        return itemResult.data;
      });

      await Promise.all(childPromises);
      console.log("All purchase items and inventory states updated successfully.");
      
      // 画面上のカートリストを空にする
      setItemList([]);
      alert("Purchase completed!");
    } catch (error) {
      console.error("Checkout submission error:", error);
    } finally {
      setIsSubmitting(false); // ロック解除
    }
  };

  const onDeleteChild = async (props: { PK: string; SK: string }) => {
    setItemList((prevList) => prevList.filter((item) => item.PK !== props.PK));

    try {
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
        <Button onClick={onSubmit} disabled={itemList.length < 1 || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
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
