import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  PurchaseTable: a
    .model({
      id: a.id(),
      PK: a.string().required(),
      SK: a.string().required(),
      type: a.string().required(),
      imagefile: a.string(),
      price: a.integer(),
      username: a.string(),
      description: a.string(),
      isInCart: a.integer(),
      isPurchased: a.integer(),
    })
    // PKとSKを複合プライマリキーとして設定
    .identifier(['PK', 'SK'])
    // セカンダリインデックス（GSI）の設定
    .secondaryIndexes((index) => [
      index('type').name('byType').queryField('purchaseTableByType'),
      index('isInCart').name('byIsInCart').queryField('purchaseTableByIsInCart'),
      index('isPurchased').name('byIsPurchased').queryField('purchaseTableByIsPurchased'),
    ])
    // 認証ルールの設定：APIキーによるパブリックアクセスと、Cognitoによる所有者アクセス
    .authorization((allow) => [
      allow.guest().to(['create', 'read', 'update', 'delete']),
      allow.owner(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // デフォルトはCognito User Pool認証
    defaultAuthorizationMode: 'userPool',
    // PurchaseTableの guest アクセス（パブリック）を許可するためにAPIキーを設定
    apiKeyAuthorizationMode: {
      expiresInDays: 30, // 必要に応じて有効期限（日数）を調整してください
    },
  },
});
