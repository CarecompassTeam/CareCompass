import { useState } from "react";
import { useNavigate , Link } from "react-router-dom";
export default function Login() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [serverError, setServerError] = useState("");

  function validate() {
    const e = {};
    if (!values.email) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) e.email = "Enter a valid email";
    if (!values.password) e.password = "Password is required";
    else if (values.password.length < 8) e.password = "At least 8 characters";
    return e;
  }
  function handleChange(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStatus("loading");
    setServerError("");
    try {
     await new Promise((r) => setTimeout(r, 500));
      if (values.password !== "12345678") throw new Error("Invalid email or password");
      localStorage.setItem("token", "fake-token");
      setStatus("idle");
      navigate("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof TypeError
          ? "Can't reach the server. Try again."
          : err.message
      );
      setStatus("error");
    }
  }

  return (
    <main className="login">
        <div className="login-avatar" aria-hidden="true">
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="24" r="12" fill="currentColor" />
    <path d="M8 64c0-14 10-22 24-22s24 8 24 22z" fill="currentColor" />
  </svg>
</div>
<h1 className="sr-only">Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input name="email" type="email" value={values.email} onChange={handleChange} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          Password
          <input name="password" type="password" value={values.password} onChange={handleChange} />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <button type="submit" className="btn" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Log in"}
        </button>
       <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
      </form>
      {status === "error" && <p className="msg msg--error" role="alert">{serverError}</p>}
    </main>
  );
}