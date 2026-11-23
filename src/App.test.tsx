import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock("@aws-amplify/ui-react", () => ({
  Authenticator: ({
    children,
  }: {
    children: (props: {
      signOut: () => void;
      user: { username: string };
    }) => ReactNode;
  }) => <>{children({ signOut: signOutMock, user: { username: "testuser" } })}</>,
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("./components/HomeBar", () => ({
  default: () => <nav data-testid="home-bar">HomeBar</nav>,
}));
vi.mock("./pages/Home", () => ({
  default: () => <div data-testid="page-home">HomePage</div>,
}));
vi.mock("./pages/Register", () => ({
  default: () => <div data-testid="page-register">RegisterPage</div>,
}));
vi.mock("./pages/Shop", () => ({
  default: () => <div data-testid="page-shop">ShopPage</div>,
}));
vi.mock("./pages/Cart", () => ({
  default: () => <div data-testid="page-cart">CartPage</div>,
}));
vi.mock("./pages/PurchaseList", () => ({
  default: () => <div data-testid="page-purchase">PurchaseListPage</div>,
}));
vi.mock("./pages/Detail", () => ({
  default: () => <div data-testid="page-detail">DetailPage</div>,
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("認証済みユーザー名と HomeBar、初期ルート（/）の Home 画面を表示し SignOut できる", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "testuser" })).toBeInTheDocument();
    expect(screen.getByTestId("home-bar")).toBeInTheDocument();
    expect(screen.getByTestId("page-home")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "SignOut" }));
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["/register", "page-register"],
    ["/shop", "page-shop"],
    ["/cart", "page-cart"],
    ["/purchase", "page-purchase"],
    ["/detail/1", "page-detail"],
  ])("パス %s にアクセスしたとき対応するページ（%s）を描画する", (path, testId) => {
    window.history.pushState({}, "", path);
    render(<App />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
