import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUser } from "./useUser";
import { useAuthenticator } from "@aws-amplify/ui-react";

vi.mock("@aws-amplify/ui-react", () => ({
  useAuthenticator: vi.fn(),
}));

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("認証済みユーザーが存在する場合、username と user オブジェクトを返す", () => {
    const mockUser = { username: "alice", userId: "user-123" };
    vi.mocked(useAuthenticator).mockImplementation((selector) => {
      selector?.({ user: mockUser } as never);
      return { user: mockUser } as never;
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.username).toBe("alice");
    expect(result.current.user).toEqual(mockUser);
  });

  it("ユーザーが未認証（undefined）の場合、username と user に undefined を返す", () => {
    vi.mocked(useAuthenticator).mockImplementation((selector) => {
      selector?.({ user: undefined } as never);
      return { user: undefined } as never;
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.username).toBeUndefined();
    expect(result.current.user).toBeUndefined();
  });
});
