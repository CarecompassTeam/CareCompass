import { steps } from "../content.js";
export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <h2>How it works</h2>
      <div className="grid grid--4">
        {steps.map((s, i) => (
          <div className="card" key={s.title}>
            <span className="num">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}