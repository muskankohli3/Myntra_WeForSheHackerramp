import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthShell, { FormField } from "../../components/ui/AuthShell";
import Button from "../../components/ui/Button";

export default function SellerLogin() {
  const { sellerLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "seller@demo.com", password: "demo1234" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sellerLogin(form.email, form.password);
      navigate("/seller/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Seller sign in"
      subtitle="Access your growth dashboard and go live."
      accent="dark"
      footer={
        <>
          New seller?{" "}
          <Link to="/seller/signup" className="font-semibold text-brand-600">
            Create a seller account
          </Link>
          <br />
          <Link to="/customer/login" className="mt-2 inline-block text-xs text-gray-400 hover:text-gray-600">
            Are you a customer? Log in here
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
        <Button type="submit" variant="dark" className="w-full" loading={loading}>
          Log in
        </Button>
        <p className="text-center text-xs text-gray-400">Demo login: seller@demo.com / demo1234</p>
      </form>
    </AuthShell>
  );
}
