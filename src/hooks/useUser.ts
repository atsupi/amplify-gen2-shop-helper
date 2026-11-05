import { useAuthenticator } from "@aws-amplify/ui-react";

export function useUser() {
  // 💡 修正ポイント: [context.user] のように配列で囲んで返します
  const { user } = useAuthenticator((context) => [context.user]);

  return {
    username: user?.username ?? undefined,
    user,
  };
}
