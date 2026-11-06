import { generateClient } from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';
import { type Schema } from '../amplify/data/resource'; // 💡 resource.tsの絶対/相対パスを環境に合わせて調整してください

// クライアントの生成
const client = generateClient<Schema>();

// Gen2でのデータの型定義の取得方法
export type PurchaseData = Schema['PurchaseTable']['type'];

// プレサインドURLの取得（Storage.get から getUrl へ移行）
export async function getPresignedUrl(key: string) {
  // Gen2のデフォルト（guestアクセス想定の場合は明示的に指定）
  const result = await getUrl({
    path: `public/${key}`, // Gen2ではpathを用いたアプローチが推奨されます
    options: {
      validateObjectExistence: false,
    }
  });
  return result.url.toString();
}

// データの全件取得 (リスト)
export const getList = async (nextToken: string | null = null) => {
  const { data, errors } = await client.models.PurchaseTable.list({
    nextToken: nextToken ?? undefined,
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { listPurchaseTables: { items: data } } };
};

// 複合主キー（PK, SK）による1件取得
export const fetchItem = async (PK: string, SK: string) => {
  const { data, errors } = await client.models.PurchaseTable.get({
    PK: PK,
    SK: SK,
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { getPurchaseTable: data } };
};

// インデックス（byType）を利用したクエリ取得
export const listItems = async (type: string) => {
  const { data, errors } = await client.models.PurchaseTable.purchaseTableByType({
    type: type,
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { purchaseTableByType: { items: data } } };
};

export type listPurchaseItemsReturnValue = {
  data: { listPurchaseTables: { items: Array<PurchaseData> } }
}

// 複合キーのPK側のみで絞り込むリスト取得
export const listPurchaseItems = async (PK: string) => {
  const { data, errors } = await client.models.PurchaseTable.list({
    filter: {
      PK: { eq: PK }
    }
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { listPurchaseTables: { items: data } } };
};

// インデックス（byIsInCart）を利用したカート内アイテムのクエリ取得
export const listItemsInCart = async () => {
  const { data, errors } = await client.models.PurchaseTable.purchaseTableByIsInCart({
    isInCart: 1,
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { purchaseTableByIsInCart: { items: data } } };
};

// ステータス更新（部分的な更新）
export async function updateItemStatus(item: Partial<PurchaseData> & { PK: string; SK: string }) {
  try {
    const { data, errors } = await client.models.PurchaseTable.update(item);
    if (errors) throw new Error(JSON.stringify(errors));
    console.log(data);
  } catch (event) {
    console.log(event);
  }
}

// データ取得（fetchPurchases）
export const fetchPurchases = async () => {
  const { data, errors } = await client.models.PurchaseTable.list();
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: { listPurchaseTables: { items: data } } };
};

// 明示的な更新メソッド
export const mutatePurchase = async (targetPurchase: Partial<PurchaseData> & { PK: string; SK: string }) => {
  const { data, errors } = await client.models.PurchaseTable.update(targetPurchase);
  if (errors) throw new Error(JSON.stringify(errors));
  return { data: targetPurchase };
};
