import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page">
      <h1>Lost in the dark.</h1>
      <p>That page doesn’t exist. <Link to="/">Return to the front page.</Link></p>
    </div>
  );
}
