import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean(),
    })
    // 💡 変更：ゲスト（guest）から、ログインユーザー本人（owner）のみ許可に変更
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // 💡 変更：デフォルトの認証モードをユーザー認証（userPool）に切り替え
    defaultAuthorizationMode: 'userPool',
  },
});
