import { useEffect, useState } from "react";

export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status === "ok" ? "Connected" : "Unexpected response");
      })
      .catch(() => {
        setApiStatus("Not connected");
      });
  }, []);

  return (
    <main style={{
      maxWidth: "720px",
      margin: "80px auto",
      padding: "24px",
      fontFamily: "Arial, sans-serif",
      lineHeight: 1.6
    }}>
      <h1>CareCompass</h1>
      <p>AI Healthcare Companion</p>
      <hr />
      <h2>Development Status</h2>
      <p>Backend: <strong>{apiStatus}</strong></p>
      <p>Initial project setup is ready for development.</p>
    </main>
  );
}
