import { brand, nav, hero } from "../content.js";
export default function Navbar() {
  return (
    <header className="navbar">
      <strong className="logo">{brand}</strong>
      <nav>{nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>
      <a className="btn" href="#top">{hero.cta}</a>
    </header>
  );
}