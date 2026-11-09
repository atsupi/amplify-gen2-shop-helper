import type { Schema } from "../amplify/data/resource";

export type PurchaseData = Schema["PurchaseTable"]["type"] & {
  index?: number;
  check?: number;
};

export interface NewItemValue {
    PK: string;
    SK: string;
    type: string;
    imagefile: string;
    price: number;
    username: string;
    description: string;
    isInCart: number;
}

export interface UpdateItemValue {
    PK: string;
    SK: string;
    type: string;
    imagefile: string;
    price: number;
    username: string;
    description: string;
    isInCart: number;
}

export interface UpdatePurchaseItemValue {
    PK: string;
    SK: string;
    type: string;
    price: number;
    username: string;
    isPurchased: number;
}
