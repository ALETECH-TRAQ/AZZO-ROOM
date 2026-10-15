"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  UsersRound,
  Monitor,
  Check,
  Sparkles,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import Brand from "../Brand";
import { getSupabase } from "@/lib/auth/client";
type Mode = "login" | "signup" | "recovery";
export default function AuthScreen({
  initialMode = "login",
  demoEnabled = false,
}: {
  initialMode?: Mode;
  demoEnabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const signup = mode === "signup",
    recovery = mode === "recovery";
  function tab(m: Mode) {
    setMode(m);
    setError("");
    setMessage("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim(),
      password = String(data.get("password") || "");
    if (signup && password !== data.get("confirm")) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    if (signup && (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) {
      setError("Use ao menos 8 caracteres, incluindo letras e números.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "O acesso por conta ainda não está configurado. Você pode conhecer o escritório na demonstração local.",
      );
      return;
    }
    setBusy(true);
    try {
      if (recovery) {
        const r = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/auth/callback?next=/recuperar-senha",
        });
        if (r.error) throw r.error;
        setMessage(
          "Se o e-mail estiver cadastrado, você receberá as instruções para recuperar o acesso.",
        );
      } else if (signup) {
        const r = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(data.get("name")) },
            emailRedirectTo: location.origin + "/auth/callback",
          },
        });
        if (r.error) throw r.error;
        if (r.data.session) location.assign("/onboarding");
        else
          setMessage(
            "Conta criada! Confira seu e-mail para confirmar o cadastro.",
          );
      } else {
        const r = await supabase.auth.signInWithPassword({ email, password });
        if (r.error) throw r.error;
        location.assign("/onboarding");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div
        className="office-art"
        role="img"
        aria-label="Escritório virtual noturno com janelas panorâmicas e iluminação azul"
      />
      <header className="auth-header">
        <Brand />
        <span>
          Uma plataforma da <b>AZZO TECH</b>
          <ArrowUpRight size={13} />
        </span>
      </header>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="overline">
            <span /> TRABALHO. CONEXÃO. NOVAS POSSIBILIDADES.
          </div>
          <h1>
            O seu time.
            <br />
            Um novo <em>espaço.</em>
          </h1>
          <p className="story-lead">Seu escritório virtual em 3D.</p>
          <p className="story-copy">
            Mais do que reuniões, um novo jeito de trabalhar.
            <br />
            Conecte pessoas, compartilhe ideias e sinta-se perto.
            <br className="desktop-break" /> De onde você estiver.
          </p>
          <div className="story-features">
            {[
              [
                Box,
                "Um espaço com a sua identidade",
                "Escritórios 3D feitos para o seu time.",
              ],
              [
                UsersRound,
                "Conexões que acontecem naturalmente",
                "Presença e colaboração, além da tela.",
              ],
              [
                Monitor,
                "Grandes ideias. Na mesma sala.",
                "Reuniões mais humanas e imersivas.",
              ],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Box;
              return (
                <div className="story-feature" key={i}>
                  <span>
                    <I size={21} strokeWidth={1.4} />
                  </span>
                  <div>
                    <strong>{String(title)}</strong>
                    <small>{String(text)}</small>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="story-badge">
            <div className="tiny-avatars">
              <b>J</b>
              <b>M</b>
              <b>A</b>
            </div>
            <span>
              Distâncias menores.
              <br />
              <strong>Possibilidades infinitas.</strong>
            </span>
            <span className="badge-line" />
            <Sparkles size={19} />
          </div>
        </section>
        <section className="auth-side">
          <div className="auth-card">
            <div className="auth-tabs" role="tablist" aria-label="Acesso">
              <button
                role="tab"
                aria-selected={!signup}
                onClick={() => tab("login")}
              >
                Entrar
              </button>
              <button
                role="tab"
                aria-selected={signup}
                onClick={() => tab("signup")}
              >
                Criar conta
              </button>
            </div>
            <div className="card-heading">
              <div className="mini-label">
                <span /> SEU PRÓXIMO GRANDE ENCONTRO COMEÇA AQUI
              </div>
              <h2>
                {recovery
                  ? "Vamos recuperar seu acesso"
                  : signup
                    ? "Seu novo espaço começa aqui."
                    : "Bom ter você por aqui."}
              </h2>
              <p>
                {recovery
                  ? "Enviaremos um link para o seu e-mail."
                  : signup
                    ? "Crie sua conta e aproxime o seu time."
                    : "Entre e sinta-se perto do seu time."}
              </p>
            </div>
            <form onSubmit={submit} className="auth-form">
              {signup && (
                <label>
                  Nome completo
                  <div className="input-wrap">
                    <UserRound size={18} />
                    <input
                      name="name"
                      autoComplete="name"
                      placeholder="Como podemos chamar você?"
                      maxLength={80}
                      required
                    />
                  </div>
                </label>
              )}
              <label>
                E-mail
                <div className="input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com.br"
                    required
                  />
                </div>
              </label>
              {!recovery && (
                <label>
                  Senha
                  <div className="input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete={
                        signup ? "new-password" : "current-password"
                      }
                      placeholder={
                        signup ? "Pelo menos 8 caracteres" : "Sua senha"
                      }
                      minLength={signup ? 8 : 1}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}
              {signup && (
                <>
                  <label>
                    Confirmar senha
                    <div className="input-wrap">
                      <ShieldCheck size={18} />
                      <input
                        name="confirm"
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repita sua senha"
                        minLength={8}
                        required
                      />
                    </div>
                  </label>
                  <small className="password-help">
                    Use letras e números para uma senha mais segura.
                  </small>
                </>
              )}
              {!signup && !recovery && (
                <div className="form-options">
                  <span>
                    <ShieldCheck size={14} /> Sessão protegida
                  </span>
                  <button type="button" onClick={() => tab("recovery")}>
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="form-success" role="status">
                  <Check size={17} />
                  {message}
                </div>
              )}
              <button className="primary-cta" disabled={busy} type="submit">
                {busy ? <LoaderCircle className="spin" size={19} /> : null}
                {recovery
                  ? "Enviar link de recuperação"
                  : signup
                    ? "Criar minha conta"
                    : "Entrar no AZZO ROOM"}
                <ArrowRight size={18} />
              </button>
            </form>
            {demoEnabled && (
              <>
                <div className="auth-divider">
                  <span />
                  ou conheça antes de entrar
                  <span />
                </div>
                <Link className="demo-button" href="/avatar?demo=1">
                  <Box size={18} /> Explorar demonstração{" "}
                  <ArrowUpRight size={16} />
                </Link>
                <p className="demo-caption">
                  Sem cadastro. Crie seu avatar e explore o espaço.
                </p>
              </>
            )}
            <p className="auth-switch">
              {signup ? "Já faz parte do time?" : "Ainda não tem uma conta?"}{" "}
              <button onClick={() => tab(signup ? "login" : "signup")}>
                {signup ? "Entrar" : "Criar conta"} <ArrowRight size={14} />
              </button>
            </p>
          </div>
          <div className="auth-trust">
            <LockKeyhole size={12} /> Seu espaço de trabalho. Sua privacidade.
          </div>
        </section>
      </div>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} AZZO TECH</span>
        <span>
          Feito para pessoas. Criado para conectar.
          <span className="footer-dot" />
        </span>
        <span>
          PT-BR <span className="footer-dot" />
        </span>
      </footer>
    </main>
  );
}
