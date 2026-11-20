import { hero } from "../content.js";
export default function Hero() {
  return (
    <section className="hero" id="top">
      <h1>{hero.title}</h1>
      <p>{hero.text}</p>
      <a className="btn" href="#how">{hero.cta}</a>
    </section>
  );
}