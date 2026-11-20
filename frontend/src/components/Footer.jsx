import { brand, disclaimer } from "../content.js";
export default function Footer() {
  return (
    <footer className="footer">
      <strong>{disclaimer}</strong>
      <p>{brand} is a graduation project. All data is synthetic.</p>
    </footer>
  );
}