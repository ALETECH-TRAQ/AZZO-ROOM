"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  UsersRound,
  Ticket,
  LogOut,
} from "lucide-react";
import { getSupabase } from "@/lib/auth/client";
import Brand from "./Brand";
type Member = { user_id: string; role: string };
type Invite = {
  id: string;
  email: string | null;
  role: string;
  expires_at: string;
  accepted_at: string | null;
};
export default function WorkspaceSettings() {
  const [workspace, setWorkspace] = useState(""),
    [title, setTitle] = useState("Meu escritório"),
    [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<Invite[]>([]),
    [role, setRole] = useState(""),
    [email, setEmail] = useState(""),
    [inviteRole, setInviteRole] = useState("member"),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    void (async () => {
      const c = getSupabase();
      const u = c ? await c.auth.getUser() : null;
      if (!u?.data.user) {
        location.replace("/login");
        return;
      }
      const w = localStorage.getItem("azzo-room-workspace");
      if (!w) {
        location.replace("/onboarding");
        return;
      }
      setWorkspace(w);
      const [a, b] = await Promise.all([
        c!.from("workspaces").select("name").eq("id", w).single(),
        c!
          .from("workspace_members")
          .select("user_id,role")
          .eq("workspace_id", w),
      ]);
      if (a.error || b.error) {
        setError("Não foi possível carregar este escritório.");
        return;
      }
      setTitle(a.data.name);
      setMembers(b.data);
      const r = b.data.find((m) => m.user_id === u.data.user!.id)?.role || "";
      setRole(r);
      if (["owner", "admin"].includes(r)) {
        const i = await c!
          .from("workspace_invites")
          .select("id,email,role,expires_at,accepted_at")
          .eq("workspace_id", w);
        if (i.data) setInvites(i.data);
      }
    })();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await getSupabase()!.rpc("create_workspace_invite", {
      p_workspace: workspace,
      p_email: email || null,
      p_role: inviteRole,
    });
    if (r.error) setError(r.error.message);
    else {
      setToken(r.data);
      setCopied(false);
    }
    setBusy(false);
  }
  async function revoke(id: string) {
    const r = await getSupabase()!.rpc("revoke_workspace_invite", { p_id: id });
    if (r.error) setError(r.error.message);
    else setInvites((v) => v.filter((i) => i.id !== id));
  }
  return (
    <main className="settings-page">
      <header className="studio-header">
        <Brand />
        <Link className="back-link" href="/app">
          <ArrowLeft size={15} /> Voltar ao escritório
        </Link>
      </header>
      <div className="settings-content">
        <span className="overline">SEU TIME, SEU ESPAÇO</span>
        <h1>{title}</h1>
        <p>Gerencie quem faz parte do seu escritório.</p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="settings-grid">
          <section className="settings-card">
            <h2>
              <UsersRound size={19} /> Membros <small>{members.length}</small>
            </h2>
            {members.map((m) => (
              <div className="member-row" key={m.user_id}>
                <span
                  className="person-avatar"
                  style={{ background: "#5f9bcc" }}
                />
                <span>
                  {m.user_id.slice(0, 8)}…<small>ID do membro</small>
                </span>
                <b>
                  {
                    (
                      {
                        owner: "Proprietário",
                        admin: "Administrador",
                        member: "Membro",
                        guest: "Visitante",
                      } as Record<string, string>
                    )[m.role]
                  }
                </b>
              </div>
            ))}
            <Link className="office-profile-link" href="/avatar">
              Personalizar meu avatar →
            </Link>
          </section>
          <section className="settings-card">
            <h2>
              <Ticket size={19} /> Convites
            </h2>
            {["owner", "admin"].includes(role) ? (
              <>
                <p>
                  Convites de uso único, válidos por 7 dias. Compartilhe o
                  código apenas com a pessoa convidada.
                </p>
                <form onSubmit={create}>
                  <label className="studio-field">
                    E-mail da pessoa <small>(opcional)</small>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pessoa@empresa.com.br"
                    />
                  </label>
                  <label className="studio-field">
                    Permissão
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="member">Membro</option>
                      <option value="guest">Visitante</option>
                    </select>
                  </label>
                  <button className="primary-cta" disabled={busy}>
                    {busy ? "Gerando…" : "Gerar convite"}
                  </button>
                </form>
                {token && (
                  <div className="invite-result">
                    <label className="studio-field">
                      Código do convite
                      <input readOnly value={token} />
                    </label>
                    <button
                      className="secondary-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(token);
                          setCopied(true);
                        } catch {
                          setError("Copie o código manualmente.");
                        }
                      }}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                      {copied ? "Copiado" : "Copiar código"}
                    </button>
                  </div>
                )}
                {invites
                  .filter(
                    (i) =>
                      !i.accepted_at && new Date(i.expires_at) > new Date(),
                  )
                  .map((i) => (
                    <div className="member-row" key={i.id}>
                      <span>
                        {i.email || "Convite de uso único"}
                        <small>
                          Expira em{" "}
                          {new Date(i.expires_at).toLocaleDateString("pt-BR")}
                        </small>
                      </span>
                      <button
                        className="text-button"
                        onClick={() => revoke(i.id)}
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
              </>
            ) : (
              <p>Apenas administradores podem gerar e revogar convites.</p>
            )}
          </section>
        </div>
        <button
          className="secondary-button"
          onClick={async () => {
            await getSupabase()?.auth.signOut();
            localStorage.removeItem("azzo-room-workspace");
            location.assign("/login");
          }}
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </main>
  );
}
