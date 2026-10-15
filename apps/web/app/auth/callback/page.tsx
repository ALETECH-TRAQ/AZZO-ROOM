"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/auth/client";
export default function Page() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Confirmando seu acesso…");
  useEffect(() => {
    void (async () => {
      const c = getSupabase();
      if (!c) {
        setMessage("Autenticação não configurada.");
        return;
      }
      const r = await c.auth.getSession();
      if (r.error || !r.data.session) {
        setMessage("Link expirado ou inválido. Solicite um novo link.");
        return;
      }
      const url = new URL(location.href);
      if (url.searchParams.get("next") === "/recuperar-senha") {
        setMessage("Escolha sua nova senha.");
        return;
      }
      location.replace("/onboarding");
    })();
  }, []);
  return (
    <main className="onboarding-page">
      <div className="onboarding-card">
        <h1>{message}</h1>
        {message === "Escolha sua nova senha." && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const password = String(fd.get("password"));
              if (password !== fd.get("confirm")) {
                setError("As senhas precisam ser iguais.");
                return;
              }
              if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
                setError("Use letras e números na senha.");
                return;
              }
              setBusy(true);
              setError("");
              const r = await getSupabase()!.auth.updateUser({
                password: String(fd.get("password")),
              });
              setBusy(false);
              if (r.error) setError(r.error.message);
              else location.replace("/onboarding");
            }}
          >
            <label className="studio-field">
              Nova senha
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>
            <label className="studio-field">
              Confirmar nova senha
              <input
                name="confirm"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="primary-cta" disabled={busy}>
              {busy ? "Salvando…" : "Salvar senha"}
            </button>
          </form>
        )}
        <p>
          <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </main>
  );
}
