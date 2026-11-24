import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "./Register";
import { uploadData, remove } from "@aws-amplify/storage";
import * as Utils from "../Utils";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    models: {
      PurchaseTable: {
        create: createMock,
      },
    },
  }),
}));

vi.mock("@aws-amplify/storage", () => ({
  uploadData: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../hooks/useUser", () => ({
  useUser: () => ({ username: "testuser" }),
}));

vi.mock("../Utils", () => ({
  getPresignedUrl: vi.fn(),
}));

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態では Submit ボタンが disabled になっている", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("画像アップロード・説明・価格の入力後に Submit で商品登録しフォームがリセットされる", async () => {
    vi.mocked(uploadData).mockImplementation(({ options }) => {
      options?.onProgress?.({ transferredBytes: 50, totalBytes: 100 });
      options?.onProgress?.({ transferredBytes: 50 });
      return { result: Promise.resolve({ path: "public/orange.png" }) } as never;
    });
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");
    createMock.mockResolvedValue({ data: { PK: "item#1" }, errors: undefined });

    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy"], "orange.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const previewImg = await screen.findByRole("img", { name: "Preview" });
    expect(previewImg).toHaveAttribute("src", "https://example.com");
    expect(Utils.getPresignedUrl).toHaveBeenCalledWith("orange.png");

    fireEvent.change(screen.getByPlaceholderText("No Description"), {
      target: { value: "Juicy Orange" },
    });
    fireEvent.change(screen.getByPlaceholderText("For free"), {
      target: { value: "300" },
    });

    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "item",
          imagefile: "orange.png",
          price: 300,
          username: "testuser",
          description: "Juicy Orange",
          isInCart: 0,
          isPurchased: 0,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("No Description")).toHaveValue("");
      expect(screen.getByPlaceholderText("For free")).toHaveValue("");
      expect(screen.getByText("No image")).toBeInTheDocument();
    });
  });

  it("画像アップロード済みで Cancel をクリックすると Storage からファイルが削除される", async () => {
    vi.mocked(uploadData).mockReturnValue({
      result: Promise.resolve({ path: "public/temp.png" }),
    } as never);
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");
    vi.mocked(remove).mockResolvedValue({ path: "public/temp.png" } as never);

    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy"], "temp.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByRole("img", { name: "Preview" });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith({ path: "public/temp.png" });
      expect(screen.getByText("No image")).toBeInTheDocument();
    });
  });

  it("API登録時に errors が返却された場合はエラーをハンドリングしフォームを保持する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(uploadData).mockReturnValue({
      result: Promise.resolve({ path: "public/err.png" }),
    } as never);
    vi.mocked(Utils.getPresignedUrl).mockResolvedValue("https://example.com");
    createMock.mockResolvedValue({ data: null, errors: [{ message: "Validation error" }] });

    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["dummy"], "err.png", { type: "image/png" })] },
    });
    await screen.findByRole("img", { name: "Preview" });

    fireEvent.change(screen.getByPlaceholderText("No Description"), {
      target: { value: "Error Item" },
    });
    fireEvent.change(screen.getByPlaceholderText("For free"), {
      target: { value: "500" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    expect(screen.getByPlaceholderText("No Description")).toHaveValue("Error Item");

    consoleSpy.mockRestore();
  });

  it("uploadData と Cancel 時の remove が失敗した場合も console.error を出力する", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // 1. uploadData の失敗ケース（48-49行目）
    vi.mocked(uploadData).mockReturnValueOnce({
      result: Promise.reject(new Error("Upload failed")),
    } as never);

    const { container, unmount } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["dummy"], "fail.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Upload error:", expect.any(Error));
    });
    unmount();

    // 2. Cancel 時の remove 失敗ケース（102-103行目）
    vi.mocked(uploadData).mockReturnValueOnce({
      result: Promise.resolve({ path: "public/cancel-fail.png" }),
    } as never);
    vi.mocked(Utils.getPresignedUrl).mockResolvedValueOnce("https://example.com");
    vi.mocked(remove).mockRejectedValueOnce(new Error("Remove failed"));

    const secondRender = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const secondFileInput = secondRender.container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(secondFileInput, {
      target: { files: [new File(["dummy"], "cancel-fail.png", { type: "image/png" })] },
    });
    await screen.findByRole("img", { name: "Preview" });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Cancel removal error:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
