import { useState } from "react";
import "../doctor.css";

const patients = [
  { id: 1, name: "Ahmed Ali", age: 45, condition: "Hypertension", lastVisit: "2026-11-10" },
  { id: 2, name: "Mona Hassan", age: 32, condition: "Diabetes", lastVisit: "2026-11-15" },
  { id: 3, name: "Omar Khaled", age: 58, condition: "Asthma", lastVisit: "2026-11-18" },
];

const doctor = { name: "Dr. Sara Mahmoud", specialty: "Internal Medicine", patients: patients.length };

export default function DoctorDashboard() {
  const [selected, setSelected] = useState(patients[0]);
  const [query, setQuery] = useState("");
  const filtered = patients.filter((p) =>
  p.name.toLowerCase().includes(query.toLowerCase())
);

  return (
    <div className="doctor-page">
      <h1>Doctor Dashboard</h1>

      <div className="doctor-layout">
        <aside className="doctor-card">
          <div className="doctor-avatar">{doctor.name.charAt(4)}</div>
          <h2>{doctor.name}</h2>
          <p>{doctor.specialty}</p>
          <p>{doctor.patients} patients</p>
        </aside>

        <section className="patient-list">
          <h2>Patients</h2>
          <input
         className="patient-search"
        placeholder="Search patients..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
/>
          <ul>
            {filtered.map((p) => (
              <li
                key={p.id}
                className={p.id === selected.id ? "active" : ""}
                onClick={() => setSelected(p)}
              >
                <div className="patient-avatar">{p.name.charAt(0)}</div>
                   <strong>{p.name}</strong>
<span className="badge">{p.condition}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="doctor-card">
          <h2>{selected.name}</h2>
          <p>Age: {selected.age}</p>
          <p>Condition: {selected.condition}</p>
          <p>Last visit: {selected.lastVisit}</p>
        </section>
      </div>
    </div>
  );
}