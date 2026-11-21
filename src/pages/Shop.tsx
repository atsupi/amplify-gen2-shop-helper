import { useEffect, useState, type ChangeEvent } from "react";
import PaginateItems from "../components/PaginateItems";
import { Button } from "@aws-amplify/ui-react";
import "./Shop.css";
import { Link } from "react-router-dom";
import { listItems } from "../Utils";
import { generateClient } from "aws-amplify/api";
import { type Schema } from "../../amplify/data/resource";
import type { PurchaseData } from "../types";

// クライアントの生成
const client = generateClient<Schema>();

function Shop() {
  const [itemList, setItemList] = useState<PurchaseData[]>([]);
  const [numberOfItems, setNumberOfItems] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 1. カート内アイテム数と商品リストの初期ロード
    const fetchShopItems = async () => {
      try {
        const res = await listItems("item");
        const rawItems = res.data.purchaseTableByType.items;
        if (cancelled) return;

        // APIレスポンスの nullable 項目を正規化してフロントエンド用 PurchaseData[] に変換
        const normalizedItems: PurchaseData[] = rawItems.map((item, i) => ({
          ...item,
          imagefile: item.imagefile ?? "",
          username: item.username ?? "",
          description: item.description ?? "",
          price: item.price ?? 0,
          isInCart: item.isInCart ?? 0,
          isPurchased: item.isPurchased ?? 0,
          index: i + 1,
          check: item.isInCart ?? 0,
        }));

        setItemList(normalizedItems);

        // カートに入っているアイテム数を集計
        const cartCount = normalizedItems.filter((item) => item.isInCart === 1).length;
        setNumberOfItems(cartCount);
      } catch (error) {
        console.error("Error fetching shop items:", error);
      }
    };

    void fetchShopItems();

    // 2. Gen2のリアルタイムサブスクリプション (onCreate) 設定
    const subscription = client.models.PurchaseTable.onCreate().subscribe({
      next: (event) => {
        console.log("New item created via subscription:", event);
      },
      error: (error) => console.error("Subscription error:", error),
    });

    // クリーンアップ関数で購読を解除
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const OpenCart = () => {
    console.log("OpenCart clicked");
  };

  const onChangeChild = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setNumberOfItems((number) => number + 1);
    } else {
      setNumberOfItems((number) => number - 1);
    }
  };

  return (
    <div className="Shop_Wrapper">
      <div className="CartButton">
        <Link to="/cart">
          <Button onClick={OpenCart}>To Cart ({numberOfItems})</Button>
        </Link>
      </div>
      <div className="ShopItemList">
        <PaginateItems
          itemsPerPage={4}
          items={itemList}
          onChange={onChangeChild}
        />
      </div>
    </div>
  );
}

export default Shop;
