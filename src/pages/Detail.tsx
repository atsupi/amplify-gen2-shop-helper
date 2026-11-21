import { Link, useParams } from "react-router-dom";
import "./Detail.css";
import DetailList from "../components/DetailList";

function Detail() {
  const { id } = useParams();
  const parsedId = Number.parseInt(id ?? "1", 10);
  const pindex = Number.isNaN(parsedId) ? 1 : parsedId;

  return (
    <div className="Detail_div">
      <DetailList pindex={pindex} />
      <div className="DetailLink">
        <Link to="/purchase">Back</Link>
      </div>
    </div>
  );
}

export default Detail;
