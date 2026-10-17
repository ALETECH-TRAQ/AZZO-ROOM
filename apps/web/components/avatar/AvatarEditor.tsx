"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Shuffle,
  RotateCcw,
  Rotate3D,
  UserRound,
  Palette,
  Smile,
  Scissors,
  Glasses,
  Shirt,
  Headphones,
  ContactRound,
  Backpack,
  Coffee,
  Watch,
  HardHat,
  GraduationCap,
  CircleDot,
  Sparkles,
  Save,
  LoaderCircle,
} from "lucide-react";
import Brand from "../Brand";
import ItemThumbnail from "./ItemThumbnail";
import {
  skins,
  hairs,
  hairColors,
  glasses,
  tops,
  accessories,
  clothingColors,
  presets,
  initialAvatar,
  loadAvatar,
  saveAvatar,
  type AvatarConfig,
} from "@/lib/avatars";
import { getSupabase } from "@/lib/auth/client";
import type { Pose } from "./AvatarRenderer";
const Preview = dynamic(() => import("./AvatarPreview"), {
  ssr: false,
  loading: () => (
    <div className="preview-loading">
      <LoaderCircle className="spin" />
      Preparando seu avatar 3D…
    </div>
  ),
});
const tabs = [
  ["Modelo", UserRound],
  ["Pele", Palette],
  ["Rosto", Smile],
  ["Cabelo", Scissors],
  ["Óculos", Glasses],
  ["Roupas", Shirt],
  ["Acessórios", Headphones],
  ["Presets", Sparkles],
] as const;
const accessoryIcons = [
  ContactRound,
  Headphones,
  Backpack,
  Coffee,
  Watch,
  HardHat,
  GraduationCap,
  CircleDot,
];
export default function AvatarEditor({
  demoEnabled,
}: {
  demoEnabled: boolean;
}) {
  const [config, setConfig] = useState<AvatarConfig>(initialAvatar),
    [tab, setTab] = useState("Modelo"),
    [pose, setPose] = useState<Pose>("idle"),
    [saved, setSaved] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false);
  useEffect(() => {
    const local = loadAvatar();
    if (local) {
      const profile = { ...local, hair: 0 };
      setConfig(profile);
      if (local.hair !== 0) saveAvatar(profile);
      setSaved(local.hair === 0);
    }
    const isDemo =
      demoEnabled && new URLSearchParams(location.search).get("demo") === "1";
    setDemo(isDemo);
    async function init() {
      if (!isDemo) {
        const c = getSupabase();
        const s = c ? await c.auth.getSession() : null;
        if (!s?.data.session) {
          location.replace("/login");
          return;
        }
        const r = await c!
          .from("avatar_profiles")
          .select("config")
          .eq("user_id", s.data.session.user.id)
          .maybeSingle();
        if (r.data?.config) {
          const { validateAvatar } = await import("@/lib/avatars");
          const valid = validateAvatar(r.data.config);
          if (valid) {
            const profile = { ...valid, hair: 0 };
            setConfig(profile);
            saveAvatar(profile);
            setSaved(valid.hair === 0);
          }
        }
      }
      setReady(true);
    }
    void init();
  }, [demoEnabled]);
  function update(p: Partial<AvatarConfig>) {
    setConfig((v) => ({ ...v, ...p }));
    setSaved(false);
    setMessage("");
  }
  async function save() {
    setBusy(true);
    try {
      saveAvatar(config);
      if (!demo) {
        const c = getSupabase()!,
          { data } = await c.auth.getUser();
        if (!data.user) throw new Error("Sua sessão expirou. Entre novamente.");
        const r = await c.from("avatar_profiles").upsert({
          user_id: data.user.id,
          config,
          updated_at: new Date().toISOString(),
        });
        if (r.error) throw r.error;
      }
      setSaved(true);
      setMessage(
        demo ? "Avatar salvo neste navegador." : "Avatar salvo no seu perfil.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  function choices(
    items: string[],
    key: "hair" | "glasses" | "top" | "bottom" | "shoes",
    symbols?: string[],
  ) {
    return (
      <div className="item-grid">
        {items.map((name, i) => (
          <button
            key={name}
            className={
              config[key] === i ? "item-option selected" : "item-option"
            }
            aria-pressed={config[key] === i}
            onClick={() => update({ [key]: i })}
          >
            <span className="item-visual">
              {symbols?.[i] || (
                <ItemThumbnail category={key} index={i} config={config} />
              )}
            </span>
            <span>{name}</span>
            {config[key] === i && (
              <Check className="selection-check" size={14} />
            )}
          </button>
        ))}
      </div>
    );
  }
  function swatches(
    colors: string[],
    key: "skin" | "hairColor" | "topColor" | "bottomColor",
  ) {
    return (
      <div className="swatches">
        {colors.map((c, i) => (
          <button
            key={c}
            aria-label={`${key} ${i + 1}`}
            aria-pressed={config[key] === i}
            title={
              key === "skin"
                ? [
                    "Muito clara",
                    "Clara",
                    "Média clara",
                    "Média",
                    "Morena",
                    "Negra",
                    "Negra escura",
                  ][i]
                : `Cor ${i + 1}`
            }
            className={config[key] === i ? "selected" : ""}
            style={{ background: c }}
            onClick={() => update({ [key]: i })}
          >
            {config[key] === i && (
              <Check size={17} color={i < 2 ? "#263447" : "white"} />
            )}
          </button>
        ))}
      </div>
    );
  }
  if (!ready)
    return (
      <main className="loading-page">
        <LoaderCircle className="spin" />
        Preparando seu espaço…
      </main>
    );
  return (
    <main className="studio-page">
      <header className="studio-header">
        <Brand />
        <span className="studio-header-label">
          AVATAR STUDIO <span className="beta-pill">BETA</span>
        </span>
        <Link className="back-link" href="/login">
          <ArrowLeft size={15} /> Voltar
        </Link>
      </header>
      <section className="studio-intro">
        <div>
          <div className="overline">SUA PRESENÇA COMEÇA COM VOCÊ</div>
          <h1>
            Um avatar. <em>O seu jeito.</em>
          </h1>
          <p>Crie a sua versão para um novo jeito de trabalhar.</p>
        </div>
        <div className="studio-steps">
          <span className="active">
            01 <b>Seu avatar</b>
          </span>
          <i />
          <span>
            02 <b>Seu escritório</b>
          </span>
        </div>
      </section>
      <div className="studio-workbench">
        <nav className="studio-categories" aria-label="Categorias do avatar">
          {tabs.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              <Icon size={20} />
              <span>{name}</span>
              {tab === name && <span className="category-dot" />}
            </button>
          ))}
          <div className="catalog-note">
            <BoxIcon />
            <span>
              3D de verdade.
              <br />
              <b>Do seu jeito.</b>
            </span>
          </div>
        </nav>
        <section className="studio-preview">
          <div className="preview-top">
            <span>
              <span className="live-dot" /> PREVIEW AO VIVO
            </span>
            <span className="preview-tag">AVATAR 3D · BETA</span>
          </div>
          <Preview config={config} pose={pose} />
          <div className="preview-bottom">
            <span>
              <Rotate3D size={16} /> Arraste para girar · Role para aproximar
            </span>
            <div className="pose-tabs">
              {(["idle", "walk", "run", "sit"] as Pose[]).map((p, i) => (
                <button
                  key={p}
                  className={pose === p ? "active" : ""}
                  onClick={() => setPose(p)}
                >
                  {["Parado", "Andando", "Correndo", "Sentado"][i]}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="studio-options">
          <div className="options-heading">
            <div>
              <span className="overline">PERSONALIZE SEU AVATAR</span>
              <h2>{tab}</h2>
            </div>
            <span className="options-number">
              0{tabs.findIndex((t) => t[0] === tab) + 1}
            </span>
          </div>
          <div className="options-scroll">
            {tab === "Modelo" && (
              <>
                <h3>Seu ponto de partida</h3>
                <p className="option-description">
                  Escolha uma das duas bases e personalize seu visual.
                </p>
                <div className="base-options">
                  {(["masc", "fem"] as const).map((b, i) => (
                    <button
                      aria-pressed={config.base === b}
                      className={config.base === b ? "selected" : ""}
                      key={b}
                      onClick={() =>
                        update({
                          base: b,
                          hair: 0,
                          body: 1,
                          accessories:
                            b === "masc"
                              ? config.accessories.filter((id) => id !== 0)
                              : config.accessories,
                        })
                      }
                    >
                      <span
                        className={`base-avatar base-avatar-${b}`}
                        aria-hidden="true"
                      >
                        <span />
                      </span>
                      <span>{["Central", "Willow"][i]}</span>
                      {config.base === b && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <label className="studio-field">
                  Nome exibido
                  <input
                    maxLength={28}
                    value={config.displayName}
                    onChange={(e) => update({ displayName: e.target.value })}
                  />
                </label>
                <label className="studio-field">
                  Pronome <small>(opcional)</small>
                  <input
                    maxLength={24}
                    value={config.pronoun}
                    placeholder="Ex.: ela/dela"
                    onChange={(e) => update({ pronoun: e.target.value })}
                  />
                </label>
                {(["height", "body"] as const).map((key, i) => (
                  <label className="range-field" key={key}>
                    {["Estatura", "Proporção do corpo"][i]}
                    <span>{Math.round(config[key] * 100)}%</span>
                    <input
                      type="range"
                      min="0.9"
                      max="1.1"
                      step="0.01"
                      value={config[key]}
                      onChange={(e) =>
                        update({ [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </>
            )}
            {tab === "Pele" && (
              <>
                <h3>Todos os tons. Todas as pessoas.</h3>
                <p className="option-description">
                  Escolha o tom que representa você.
                </p>
                {swatches(skins, "skin")}
                <div className="selected-color">
                  <span style={{ background: skins[config.skin] }} />
                  <div>
                    <small>TOM SELECIONADO</small>
                    <strong>
                      {
                        [
                          "Muito clara",
                          "Clara",
                          "Média clara",
                          "Média",
                          "Morena",
                          "Negra",
                          "Negra escura",
                        ][config.skin]
                      }
                    </strong>
                  </div>
                  <CheckCheck size={21} />
                </div>
              </>
            )}
            {tab === "Rosto" && (
              <>
                <h3>Cor dos olhos</h3>
                <div className="swatches">
                  {["#3b2720", "#6b8d78", "#6293bf", "#20212a"].map((c, i) => (
                    <button
                      key={c}
                      aria-label={["Castanho", "Verde", "Azul", "Escuro"][i]}
                      aria-pressed={config.eyes === c}
                      style={{ background: c }}
                      className={config.eyes === c ? "selected" : ""}
                      onClick={() => update({ eyes: c })}
                    >
                      {config.eyes === c && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <label className="range-field">
                  Formato do rosto<span>{Math.round(config.face * 100)}%</span>
                  <input
                    type="range"
                    min="0.9"
                    max="1.1"
                    step="0.01"
                    value={config.face}
                    onChange={(e) => update({ face: Number(e.target.value) })}
                  />
                </label>
              </>
            )}
            {tab === "Cabelo" && (
              <>
                <h3>Cor do cabelo</h3>
                {swatches(hairColors, "hairColor")}
                <h3>Penteado esculpido</h3>
                <p className="option-description">
                  O cabelo faz parte do modelo original. Você pode escolher a
                  cor; cortes adicionais precisam de peças 3D compatíveis.
                </p>
                {choices(hairs.slice(0, 1), "hair")}
              </>
            )}
            {tab === "Óculos" && (
              <>
                <p className="option-description">Um detalhe que muda tudo.</p>
                {choices(glasses, "glasses")}
              </>
            )}
            {tab === "Roupas" && (
              <>
                <h3>Parte de cima</h3>
                {choices(tops, "top")}
                <h3>Cor da roupa</h3>
                {swatches(clothingColors, "topColor")}
                <h3>Parte de baixo</h3>
                {choices(["Calça", "Shorts"], "bottom")}
                <h3>Cor da parte de baixo</h3>
                {swatches(clothingColors, "bottomColor")}
                <h3>Calçado</h3>
                {choices(["Social", "Tênis"], "shoes")}
              </>
            )}
            {tab === "Acessórios" && (
              <>
                <p className="option-description">
                  Pequenos detalhes, muita personalidade. Escolha apenas um item
                  de cabeça por vez.
                </p>
                <div className="accessory-list">
                  {accessories.map((a, i) => (
                    <button
                      key={a}
                      disabled={i === 0 && config.base === "masc"}
                      aria-pressed={config.accessories.includes(i)}
                      className={
                        config.accessories.includes(i) ? "selected" : ""
                      }
                      aria-label={
                        i === 0 && config.base === "masc"
                          ? "Crachá já incluído no modelo"
                          : a
                      }
                      onClick={() => {
                        if (config.accessories.includes(i)) {
                          update({
                            accessories: config.accessories.filter(
                              (x) => x !== i,
                            ),
                          });
                          return;
                        }
                        const headItems = [1, 5, 6];
                        const next = config.accessories.filter(
                          (x) =>
                            !(headItems.includes(i) && headItems.includes(x)),
                        );
                        update({ accessories: [...next, i] });
                      }}
                    >
                      {(() => {
                        const Icon = accessoryIcons[i];
                        return (
                          <Icon
                            size={21}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        );
                      })()}
                      <span>
                        {a}
                        {i === 0 && config.base === "masc"
                          ? " · já incluído"
                          : ""}
                      </span>
                      <span className="toggle-switch" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === "Presets" && (
              <>
                <p className="option-description">
                  Um começo inspirado. Todos os detalhes são editáveis.
                </p>
                <div className="preset-grid">
                  {presets.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() =>
                        update({
                          ...p.config,
                          hair: 0,
                          displayName: config.displayName,
                          pronoun: config.pronoun,
                        })
                      }
                    >
                      <span
                        style={{
                          background: `linear-gradient(145deg,${clothingColors[p.config.topColor]}33,#14263d)`,
                        }}
                      >
                        <UserRound size={34} color={skins[p.config.skin]} />
                        <b>{String(i + 1).padStart(2, "0")}</b>
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="studio-tools">
            <button
              onClick={() => {
                const p = presets[Math.floor(Math.random() * presets.length)];
                update({
                  ...p.config,
                  displayName: config.displayName,
                  skin: Math.floor(Math.random() * 7),
                  hair: 0,
                });
              }}
            >
              <Shuffle size={15} /> Aleatório
            </button>
            <button
              onClick={() => {
                update(initialAvatar());
                setPose("idle");
              }}
            >
              <RotateCcw size={15} /> Restaurar
            </button>
          </div>
        </section>
      </div>
      <footer className="studio-footer">
        <div
          className={saved ? "save-status saved" : "save-status"}
          aria-live="polite"
        >
          {saved ? <CheckCheck size={18} /> : <span className="unsaved-dot" />}
          <span>
            {message ||
              (saved
                ? "Tudo salvo. Pronto para encontrar seu time."
                : "Seu avatar, suas escolhas. Salve para continuar.")}
            {demo && <small>Demonstração local · sem conta corporativa</small>}
          </span>
        </div>
        <div className="studio-actions">
          <button className="secondary-button" disabled={busy} onClick={save}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Save size={16} />
            )}{" "}
            Salvar avatar
          </button>
          <button
            className="primary-cta"
            disabled={!saved}
            onClick={() => location.assign(demo ? "/app?demo=1" : "/app")}
          >
            Entrar no escritório <ArrowRight size={17} />
          </button>
        </div>
      </footer>
    </main>
  );
}
function BoxIcon() {
  return <Sparkles size={22} />;
}
