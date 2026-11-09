import React, { useEffect, useState } from "react";
import "./DetailItem.css";
import { getPresignedUrl } from "../Utils";
import { Checkbox } from "@mui/material";
import { PurchaseData } from "../types";

type Props = {
  item: PurchaseData;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function DetailItem(props: Props) {
  const [presignedUrl, setPresignedUrl] = useState("");
  const [isChecked, setIsChecked] = useState(props.item.isPurchased === 1);

  useEffect(() => {
    getPresignedUrl(props.item.imagefile ?? "").then((data) => {
      setPresignedUrl(data);
    });
  }, [props.item.imagefile]);

  const onChangeCheckbox = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setIsChecked(event.target.checked);
    props.onChange(event);
  };

  return (
    <>
      <div className="DetailItem_div" key={props.item.id}>
        <div className="checkbox">
          <Checkbox
            checked={isChecked ? true : false}
            color="success"
            onChange={onChangeCheckbox}
            slotProps={{ input: { "aria-label": `${props.item.index}`} }}
          />
        </div>
        <img src={presignedUrl} width="60" height="80" />
        <p>{props.item.description}</p>
        <p>{props.item.price} JPY</p>
      </div>
    </>
  );
}

export default DetailItem;
