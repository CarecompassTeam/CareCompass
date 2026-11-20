import { features } from "../content.js";
export default function Features() {
  return (
    <section id="features" className="section">
      <h2>Features</h2>
      <div className="grid grid--3">
        {features.map((f) => (
          <div className="card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}