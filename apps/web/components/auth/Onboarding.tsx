"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Ticket, LoaderCircle } from "lucide-react";
import Brand from "../Brand";
import { getSupabase } from "@/lib/auth/client";
export default function Onboarding() {
  const [mode, setMode] = useState("create"),
    [name, setName] = useState(""),
    [invite, setInvite] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      const c = getSupabase();
      const r = c ? await c.auth.getSession() : null;
      if (!r?.data.session) {
        location.replace("/login");
        return;
      }
      const memberships = await c!
        .from("workspace_members")
        .select("workspace_id,workspaces(name)")
        .eq("user_id", r.data.session.user.id);
      if (memberships.error) {
        setMessage(
          "Aplique as migrações Supabase para habilitar os escritórios.",
        );
      }
      if (memberships.data?.length) {
        localStorage.setItem(
          "azzo-room-workspace",
          memberships.data[0].workspace_id,
        );
        location.replace("/avatar");
        return;
      }
      setReady(true);
    })();
  }, []);
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const c = getSupabase();
      if (!c) throw new Error("Autenticação não configurada.");
      const r =
        mode === "create"
          ? await c.rpc("create_workspace", { p_name: name.trim() })
          : await c.rpc("accept_workspace_invite", { p_token: invite.trim() });
      if (r.error) throw r.error;
      localStorage.setItem("azzo-room-workspace", r.data);
      location.assign("/avatar");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível continuar.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <main className="loading-page">
        <LoaderCircle className="spin" />
        Verificando seu espaço…
      </main>
    );
  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <Brand />
        <h1>Encontre o seu lugar.</h1>
        <p>
          Crie um espaço para o seu time ou aceite um convite para um escritório
          existente.
        </p>
        <div className="base-options">
          <button
            className={mode === "create" ? "selected" : ""}
            onClick={() => setMode("create")}
          >
            <Building2 />
            Criar meu escritório
          </button>
          <button
            className={mode === "invite" ? "selected" : ""}
            onClick={() => setMode("invite")}
          >
            <Ticket />
            Entrar com convite
          </button>
        </div>
        <form onSubmit={next}>
          <label className="studio-field">
            {mode === "create" ? "Nome do escritório" : "Código de convite"}
            <input
              required
              value={mode === "create" ? name : invite}
              minLength={mode === "create" ? 2 : 32}
              maxLength={mode === "create" ? 100 : 128}
              onChange={(e) =>
                mode === "create"
                  ? setName(e.target.value)
                  : setInvite(e.target.value)
              }
              placeholder={
                mode === "create" ? "Ex.: Time AZZO" : "Cole o código recebido"
              }
            />
          </label>
          {message && (
            <p role="alert" className="form-error">
              {message}
            </p>
          )}
          <button className="primary-cta" disabled={busy}>
            {busy ? "Preparando…" : "Continuar para meu avatar"}
            <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  );
}
