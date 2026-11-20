import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact">
      <h2>Contact us</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Your name" required />
        <input name="email" type="email" placeholder="Your email" required />
        <textarea name="message" placeholder="Your message" required />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Send"}
        </button>
      </form>
     {status === "success" && <p className="msg msg--ok" role="status">Thanks! We'll get back to you soon.</p>}
     {status === "error" && <p className="msg msg--error" role="alert">Something went wrong. Please try again.</p>}
    </section>
  );
}