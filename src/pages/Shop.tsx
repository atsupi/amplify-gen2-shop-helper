import { useEffect, useState, ChangeEvent } from "react";
import PaginateItems from "../components/PaginateItems";
import { Button } from "@aws-amplify/ui-react";
import "./Shop.css";
import { Link } from "react-router-dom";
import { listItems } from "../Utils";
import { generateClient } from "aws-amplify/api";
import { type Schema } from "../../amplify/data/resource"; // 💡 パスは環境に合わせて調整してください

// クライアントの生成
const client = generateClient<Schema>();

// Gen2データ型の定義
type PurchaseData = Schema['PurchaseTable']['type'];

function Shop() {
  const [itemList, setItemList] = useState<PurchaseData[]>([]);
  const [numberOfItems, setNumberOfItems] = useState(0);

  useEffect(() => {
    // 1. カート内アイテム数と商品リストの初期ロード
    const fetchShopItems = async () => {
      try {
        const res = await listItems("item");
        const items = res.data.purchaseTableByType.items;
        setItemList(items);

        // カートに入っているアイテム数を集計
        const cartCount = items.filter(item => item.isInCart === 1).length;
        setNumberOfItems(cartCount);
      } catch (error) {
        console.error("Error fetching shop items:", error);
      }
    };

    fetchShopItems();

    // 2. Gen2のリアルタイムサブスクリプション (onCreate) 設定
    const subscription = client.models.PurchaseTable.onCreate().subscribe({
      next: (event) => {
        console.log("New item created via subscription:", event);
        // 必要に応じてここで setItemList などを更新するロジックを追加できます
      },
      error: (error) => console.error("Subscription error:", error),
    });

    // クリーンアップ関数で購読を解除
    return () => {
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
    <>
      <div className="Shop_Wrapper">
        <div className="CartButton">
          <Link to="/cart">
            <Button onClick={OpenCart}>To Cart ({numberOfItems})</Button>
          </Link>
        </div>
        <div className="ShopItemList">
          <PaginateItems
            itemsPerPage={4}
            items={itemList as any}
            onChange={onChangeChild}
          />
        </div>
      </div>
    </>
  );
}

export default Shop;
