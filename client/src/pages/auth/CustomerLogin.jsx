import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthShell, { FormField } from "../../components/ui/AuthShell";
import Button from "../../components/ui/Button";

export default function CustomerLogin() {
  const { customerLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "customer@demo.com", password: "demo1234" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await customerLogin(form.email, form.password);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to shop live sessions and track your orders."
      footer={
        <>
          New here?{" "}
          <Link to="/customer/signup" className="font-semibold text-brand-600">
            Create a customer account
          </Link>
          <br />
          <Link to="/seller/login" className="mt-2 inline-block text-xs text-gray-400 hover:text-gray-600">
            Are you a seller? Log in here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <FormField
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Log in
        </Button>
        <p className="text-center text-xs text-gray-400">Demo login: customer@demo.com / demo1234</p>
      </form>
    </AuthShell>
  );
}
