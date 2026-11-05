import "./Register.css";
import { useUser } from "../hooks/useUser";
import { uploadData, remove } from "@aws-amplify/storage";
import { useState, ChangeEvent } from "react";
import { Button } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/api";
import { type Schema } from "../../amplify/data/resource"; 
import { getPresignedUrl } from "../Utils";
import { Link } from "react-router-dom";

// クライアントの生成
const client = generateClient<Schema>();

function Register() {
  const { username } = useUser();
  const [presignedUrl, setPresignedUrl] = useState("");
  const [dataName, setDataName] = useState("No image");
  const [isUrlSet, setIsUrlSet] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const inputFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(file);
    if (file.size < 20000000) {
      try {
        const uploadTask = uploadData({
          path: `public/${file.name}`,
          data: file,
          options: {
            onProgress: (progress) => {
              let percentage = (100 * progress.transferredBytes) / progress.totalBytes!;
              console.log(`progress: ${percentage}%`);
            },
          },
        });

        await uploadTask.result;

        const resultUrl = await getPresignedUrl(file.name);
        setPresignedUrl(resultUrl);
        setDataName(file.name);
        setIsUrlSet(true);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  const inputDescription = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const inputPrice = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
  };

  const registerItem = async () => {
    const itemId = new Date().getTime().toString();
    
    // 💡 型安全性を高めるため、スキーマから期待される引数型（CreateInput）にキャストするか安全にオブジェクトを作ります
    const value = {
      // id: itemId, // 💡 もしresource.tsの a.id() で型エラーが出る場合はここを生かすか、スキーマ側から除外してください
      PK: "item#" + itemId,
      SK: "#meta#" + itemId,
      type: "item",
      imagefile: dataName,
      price: parseInt(price) || 0,
      username: username || "unknown", 
      description: description,
      isInCart: 0,
      isPurchased: 0,
    };

    try {
      // `as any` キャストを念のため挟むことで、バックエンドスキーマの軽微なオプショナル差分によるクライアントエラーを未然に防ぎます
      const { data, errors } = await client.models.PurchaseTable.create(value as any);
      if (errors) throw new Error(JSON.stringify(errors));
      console.log("Registered item successfully:", data);
      
      // 登録成功後のステートクリーンアップ
      setDescription("");
      setPrice("");
      setIsUrlSet(false);
      setDataName("No image");
      setPresignedUrl("");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const cancelRegistration = async () => {
    if (isUrlSet) {
      try {
        await remove({
          path: `public/${dataName}`,
        });
        console.log("Removed cancelled temporary file successfully");
        setIsUrlSet(false);
        setDataName("No image");
        setPresignedUrl("");
      } catch (error) {
        console.error("Cancel removal error:", error);
      }
    }
  };

  return (
    <>
      <h2>Register Page</h2>
      <div className="Description">
        <label>Description:</label>
        <textarea
          value={description}
          onChange={inputDescription}
          placeholder="No Description"
        />
      </div>
      <div className="Price">
        <label>Price (JPY):</label>
        <input
          type="text"
          value={price}
          placeholder="For free"
          onChange={inputPrice}
        />
      </div>
      <br />
      <div className="Uploader">
        <input type="file" onChange={inputFile} />
      </div>

      <div>
        {isUrlSet ? (
          <img src={presignedUrl} width="120" height="120" alt="Preview" />
        ) : (
          `${dataName}`
        )}
      </div>
      <br />
      <div className="ControlButtons">
        <Button
          disabled={!(description !== "" && price !== "" && isUrlSet)}
          onClick={registerItem}
        >
          Submit
        </Button>
        <Link to="/shop">
          <Button onClick={cancelRegistration}>Cancel</Button>
        </Link>
      </div>
    </>
  );
}

export default Register;
