// amplify/storage/resource.ts
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyGen2ShopHelperStorage', // 任意のバケット識別名
  access: (allow) => ({
    'public/*': [
      allow.guest(['read', 'write', 'delete']),
      allow.authenticated(['read', 'write', 'delete'])
    ]
  })
});
