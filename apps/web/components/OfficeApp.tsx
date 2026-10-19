"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type Room } from "@colyseus/sdk";
import {
  Building2,
  Camera,
  CircleHelp,
  DoorOpen,
  Headphones,
  Mic,
  MonitorUp,
  Users,
  Video,
  View,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  isNearMeeting,
  OFFICE_ID,
  type CameraMode,
  type MediaMode,
  type OnlinePlayer,
  type Position,
} from "@/lib/types";
import VoiceManager from "./VoiceManager";
import Link from "next/link";
import { loadAvatar, type AvatarConfig } from "@/lib/avatars";
import { getSupabase } from "@/lib/auth/client";
import {
  remotePlayers,
  networkLog,
  type NetworkState,
} from "@/lib/multiplayer";
const OfficeWorld = dynamic(() => import("./OfficeWorld"), {
  ssr: false,
  loading: () => (
    <div className="world-loading">Preparando o escritório 3D...</div>
  ),
});
const COLORS = ["#66ddce", "#8fa7f2", "#edbd86", "#e8a9bf", "#a1cb8b"];

export default function OfficeApp({ demoEnabled }: { demoEnabled: boolean }) {
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [demo, setDemo] = useState(false);
  const [officeId, setOfficeId] = useState(OFFICE_ID);
  const [accessToken, setAccessToken] = useState("");
  const [meetings, setMeetings] = useState<{ id: string; title: string }[]>([]);
  const [meetingId, setMeetingId] = useState("");
  const [mode, setMode] = useState<CameraMode>("iso");
  const [isometricPrototype, setIsometricPrototype] = useState(false);
  const [name, setName] = useState("Visitante");
  const [color, setColor] = useState(COLORS[0]);
  const [userId, setUserId] = useState("");
  const [joined, setJoined] = useState(false);
  const [connection, setConnection] = useState("Desconectado");
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [position, setPosition] = useState<Position>({ x: 0, z: 5, yaw: 0 });
  const posRef = useRef<Position>({ x: 0, z: 5, yaw: 0 });
  const [mediaMode, setMediaMode] = useState<MediaMode | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [networkSpawn, setNetworkSpawn] = useState<
    (Position & { sessionId: string }) | null
  >(null);
  const near = isNearMeeting(position);
  const selectPrototype = (enabled: boolean) => {
    const url = new URL(location.href);
    if (enabled) url.searchParams.set("view", "isometric");
    else url.searchParams.delete("view");
    history.replaceState(null, "", url);
    setIsometricPrototype(enabled);
  };

  useEffect(() => {
    setIsometricPrototype(
      new URLSearchParams(location.search).get("view") === "isometric",
    );
    const local = loadAvatar();
    if (!local) {
      location.replace("/avatar" + location.search);
      return;
    }
    setAvatar(local);
    setName(local.displayName);
    setColor("#4baeff");
    const isDemo =
      demoEnabled && new URLSearchParams(location.search).get("demo") === "1";
    setDemo(isDemo);
    if (!isDemo) {
      void (async () => {
        const c = getSupabase();
        const r = c ? await c.auth.getSession() : null;
        const session = r?.data.session;
        if (!session) {
          location.replace("/login");
          return;
        }
        const workspace = localStorage.getItem("azzo-room-workspace");
        if (!workspace) {
          location.replace("/onboarding");
          return;
        }
        setOfficeId(workspace);
        const rooms = await c!
          .from("meeting_rooms")
          .select("id,title")
          .eq("workspace_id", workspace);
        if (rooms.data?.length) {
          setMeetings(rooms.data);
          setMeetingId(rooms.data[0].id);
        }
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setJoined(true);
      })();
      return;
    }
    let id = sessionStorage.getItem("azzo-space-dev-id");
    if (!id) {
      id = `guest_${crypto.randomUUID().slice(0, 12)}`;
      sessionStorage.setItem("azzo-space-dev-id", id);
    }
    setUserId(id);
    setJoined(true);
  }, [demoEnabled]);
  useEffect(() => {
    if (!joined || !userId) return;
    let disposed = false;
    let connecting = false;
    let attempts = 0;
    let activeRoom: Room | null = null;
    let sendTimer: ReturnType<typeof setInterval> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const stopSending = () => {
      if (sendTimer) clearInterval(sendTimer);
      sendTimer = undefined;
    };
    const current = (room: Room) => !disposed && activeRoom === room;
    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      const delay = Math.min(1000 * 2 ** Math.min(attempts++, 4), 15000);
      setConnection("Reconectando…");
      networkLog("retry", { officeId, delay });
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void connect();
      }, delay);
    };
    const connect = async () => {
      if (disposed || connecting || activeRoom) return;
      connecting = true;
      setConnection(attempts ? "Reconectando…" : "Conectando...");
      try {
        const endpoint =
          process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
          (process.env.NODE_ENV === "development"
            ? `${location.protocol}//${location.hostname}:2567`
            : "");
        if (!endpoint) {
          setConnection("Servidor multiplayer não configurado");
          return;
        }
        const session = demo
          ? null
          : (await getSupabase()?.auth.getSession())?.data.session;
        if (!demo && !session) {
          setConnection("Sessão expirada. Entre novamente.");
          return;
        }
        if (disposed) return;
        const game = new Client(endpoint);
        const room = await game.joinOrCreate("office", {
          officeId,
          userId,
          name,
          color,
          avatar,
          accessToken: session?.access_token || accessToken,
        });
        if (disposed) {
          void room.leave();
          return;
        }
        activeRoom = room;
        roomRef.current = room;
        // A network interruption immediately after joining must also reconnect.
        room.reconnection.minUptime = 0;
        let receivedInitialState = false;
        let previousSessions = new Set<string>();
        let lastPositionLog = 0;
        const updatePlayers = () => {
          if (!current(room)) return;
          const state = room.state as NetworkState;
          const own = state.players?.get(room.sessionId);
          if (!own) return; // JOIN_ROOM can precede the initial full state packet.
          if (!receivedInitialState) {
            receivedInitialState = true;
            attempts = 0;
            const spawn = {
              sessionId: room.sessionId,
              x: own.x,
              y: own.y || 0,
              z: own.z,
              yaw: own.yaw,
            };
            posRef.current = spawn;
            setNetworkSpawn(spawn);
            setConnection("Online");
            networkLog("connected", {
              officeId,
              roomId: room.roomId,
              sessionId: room.sessionId,
              userId,
            });
          }
          const result = remotePlayers(state, room.sessionId);
          const nextSessions = new Set(result.map((p) => p.sessionId));
          for (const id of nextSessions)
            if (!previousSessions.has(id))
              networkLog("player-enter", { officeId, sessionId: id });
          for (const id of previousSessions)
            if (!nextSessions.has(id))
              networkLog("player-leave", { officeId, sessionId: id });
          previousSessions = nextSessions;
          if (Date.now() - lastPositionLog > 5000) {
            networkLog("state", {
              roomId: room.roomId,
              total: state.players?.size,
              remote: result.map((p) => ({
                sessionId: p.sessionId,
                x: p.x,
                y: p.y,
                z: p.z,
                animation: p.animation,
              })),
            });
            lastPositionLog = Date.now();
          }
          setPlayers(result);
        };
        room.onStateChange(updatePlayers);
        room.onDrop(() => {
          if (current(room)) {
            setConnection("Reconectando…");
            networkLog("drop", {
              roomId: room.roomId,
              sessionId: room.sessionId,
            });
          }
        });
        room.onReconnect(() => {
          if (current(room)) {
            setConnection("Online");
            updatePlayers();
            networkLog("reconnected", {
              roomId: room.roomId,
              sessionId: room.sessionId,
            });
          }
        });
        room.onLeave((code) => {
          if (!current(room)) return;
          stopSending();
          networkLog("disconnected", { officeId, roomId: room.roomId, code });
          activeRoom = null;
          if (roomRef.current === room) roomRef.current = null;
          setPlayers([]);
          scheduleRetry();
        });
        room.onError((code) => {
          if (current(room)) {
            console.warn("[AZZO multiplayer] room-error", {
              officeId,
              roomId: room.roomId,
              code,
            });
            setConnection("Falha na conexão multiplayer");
          }
        });
        updatePlayers();
        sendTimer = setInterval(() => {
          if (current(room) && receivedInitialState && room.connection.isOpen)
            room.send("move", { ...posRef.current, y: 0 });
        }, 100);
      } catch (error) {
        if (!disposed) {
          console.warn("[AZZO multiplayer] connection-failed", {
            officeId,
            code: (error as { code?: number }).code,
          });
          scheduleRetry();
        }
      } finally {
        connecting = false;
      }
    };
    const online = () => {
      if (!activeRoom && !connecting) {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = undefined;
        void connect();
      }
    };
    window.addEventListener("online", online);
    void connect();
    return () => {
      disposed = true;
      window.removeEventListener("online", online);
      stopSending();
      if (retryTimer) clearTimeout(retryTimer);
      if (activeRoom) {
        activeRoom.reconnection.enabled = false;
        if (roomRef.current === activeRoom) roomRef.current = null;
        void activeRoom.leave();
      }
      setPlayers([]);
    };
  }, [joined, userId, name, color, officeId, accessToken, demo]);

  useEffect(() => {
    if (avatar && roomRef.current?.connection.isOpen)
      roomRef.current.send("avatar", avatar);
  }, [avatar]);
  useEffect(() => {
    const refresh = () => {
      const next = loadAvatar();
      if (next) setAvatar(next);
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const onPosition = useCallback((p: Position) => {
    posRef.current = p;
    setPosition(p);
  }, []);
  const join = () => {
    const safe = name.trim().slice(0, 28) || "Visitante";
    setName(safe);
    sessionStorage.setItem("azzo-space-name", safe);
    setJoined(true);
  };
  const enterMeeting = () => {
    if (isNearMeeting(posRef.current)) setMediaMode("meeting");
  };
  useEffect(() => {
    const hotkey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key.toLowerCase() === "v" && !isometricPrototype)
        setMode((m) => (m === "iso" ? "third" : "iso"));
      if (
        e.key.toLowerCase() === "e" &&
        mediaMode !== "meeting" &&
        isNearMeeting(posRef.current)
      )
        setMediaMode("meeting");
      if (e.key === "Escape" && mediaMode === "meeting") setMediaMode(null);
    };
    window.addEventListener("keydown", hotkey);
    return () => window.removeEventListener("keydown", hotkey);
  }, [mediaMode, isometricPrototype]);
  if (!avatar)
    return <main className="loading-page">Preparando seu escritório…</main>;
  return (
    <main className="app-shell">
      <div className="game-world">
        <OfficeWorld
          isometricPrototype={isometricPrototype}
          mode={mode}
          color={color}
          avatar={avatar}
          players={players}
          onPosition={onPosition}
          networkSpawn={networkSpawn}
        />
      </div>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <strong>
              AZZO <span>ROOM</span>
            </strong>
            <small>O trabalho acontece aqui.</small>
          </div>
        </div>
        <div className="top-pills">
          <span className="pill">
            <Building2 size={14} />{" "}
            {demo ? "Demonstração local" : "Meu escritório"}
          </span>
          <span className="pill online">
            <span className="live-dot" />
            {joined ? connection : "Modo demonstração"}
          </span>
        </div>
      </header>
      <aside className="sidebar">
        <div className="side-card">
          <p className="eyebrow">ESCRITÓRIO VIRTUAL</p>
          <h1>Seu novo espaço de trabalho.</h1>
          <p className="muted">
            Encontre seu time, caminhe pelo escritório e participe de reuniões
            em tempo real.
          </p>
          <Link
            className="office-profile-link"
            href={demo ? "/avatar?demo=1" : "/avatar"}
          >
            ✦ Personalizar avatar
          </Link>
          {!demo && (
            <Link className="office-profile-link" href="/configuracoes">
              Gerenciar escritório →
            </Link>
          )}
          <div className="divider" />
          <div className="stat-row">
            <span>
              <Users size={16} /> Pessoas no espaço
            </span>
            <strong>
              {joined && connection === "Online" ? players.length + 1 : 1}
            </strong>
          </div>
          <div className="stat-row">
            <span>
              <Camera size={16} /> Sua visualização
            </span>
            <strong>
              {isometricPrototype
                ? "Isométrica · protótipo"
                : mode === "iso"
                  ? "Isométrica"
                  : "3ª pessoa"}
            </strong>
          </div>
          <button
            className="button-primary full"
            onClick={() =>
              isometricPrototype
                ? selectPrototype(false)
                : setMode((v) => (v === "iso" ? "third" : "iso"))
            }
          >
            <View size={17} />{" "}
            {isometricPrototype ? (
              "Voltar à visão 3D"
            ) : (
              <>
                Alternar câmera <kbd>V</kbd>
              </>
            )}
          </button>
          {!isometricPrototype ? (
            <button
              className="secondary-button full"
              onClick={() => selectPrototype(true)}
            >
              Testar visão isométrica
            </button>
          ) : (
            <p className="muted">
              Protótipo de câmera e controles. Cenário e avatares 3D
              provisórios; arte 2D ainda não integrada.
            </p>
          )}
        </div>
        <div className="side-card people-card">
          <div className="card-title">
            <span>Equipe no escritório</span>
            <span className="count">{players.length + 1}</span>
          </div>
          <div className="person">
            <span
              className="person-avatar"
              style={{ backgroundColor: color }}
            />
            {name} <small>(você)</small>
            <span className="live-dot" />
          </div>
          {players.map((p) => (
            <div
              className="person"
              key={p.sessionId}
              data-player-session={p.sessionId}
              data-player-x={p.x}
              data-player-z={p.z}
              data-player-yaw={p.yaw}
              data-player-animation={p.animation}
              data-avatar-base={p.avatar?.base || "masc"}
            >
              <span
                className="person-avatar"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
              <span className="live-dot" />
            </div>
          ))}
          {players.length === 0 && (
            <small className="muted">
              Abra uma segunda aba para testar o multiplayer.
            </small>
          )}
        </div>
      </aside>
      <aside className="right-panel">
        <div className="location-chip">
          <span className="chip-dot" />{" "}
          {near ? "Sala de reunião" : "Espaço compartilhado"}
        </div>
        <div className="meeting-card">
          <span className="eyebrow">AMBIENTE INTERATIVO</span>
          <h3>{near ? "Reunião estratégica" : "Sala de reunião"}</h3>
          <p>
            {near
              ? "Você está próximo da sala. Entre para compartilhar câmera e tela."
              : "Aproxime-se da mesa de reunião à direita do escritório."}
          </p>
          {!demo && meetings.length > 0 && (
            <label className="meeting-select">
              Escolha uma sala
              <select
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className={near ? "button-primary full" : "button-disabled full"}
            disabled={!near}
            onClick={enterMeeting}
          >
            <DoorOpen size={17} />{" "}
            {near ? "Entrar na reunião · E" : "Aproxime-se para entrar"}
          </button>
        </div>
        {joined && !mediaMode && (
          <div className="audio-card">
            <Mic size={18} />
            <div>
              <strong>Conversa por proximidade</strong>
              <small>O volume diminui quando você se afasta.</small>
            </div>
            {mediaMode === null && (
              <button
                className="tiny-btn"
                onClick={() => setMediaMode("office")}
              >
                Ativar áudio
              </button>
            )}
          </div>
        )}
      </aside>
      <footer className="game-footer">
        <div className="controls">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
          <span>Movimentar</span>
          <i />
          <kbd>Shift</kbd>
          <span>Correr</span>
          <i />
          <kbd>V</kbd>
          <span>{isometricPrototype ? "Zoom" : "Câmera"}</span>
          <i />
          <kbd>E</kbd>
          <span>Interagir</span>
        </div>
        <div className="version">
          <CircleHelp size={14} /> PROTÓTIPO 0.1
        </div>
      </footer>
      {!joined && (
        <div className="welcome-backdrop">
          <section className="welcome-modal">
            <span className="eyebrow">BEM-VINDO AO FUTURO DO TRABALHO</span>
            <h2>
              Entre no <span>AZZO ROOM.</span>
            </h2>
            <p>
              Escolha seu nome e uma cor para explorar a sede virtual com sua
              equipe.
            </p>
            <label htmlFor="avatar-name">Como devemos chamar você?</label>
            <input
              id="avatar-name"
              maxLength={28}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") join();
              }}
            />
            <label>Cor do seu avatar</label>
            <div className="colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Escolher ${c}`}
                  className={c === color ? "selected" : ""}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button className="button-primary full big" onClick={join}>
              <DoorOpen size={18} /> Entrar no escritório
            </button>
            <small>
              Modo de demonstração local. Para colaboração online, execute
              também o servidor multiplayer.
            </small>
          </section>
        </div>
      )}
      {joined && mediaMode && userId && (
        <VoiceManager
          key={mediaMode}
          mode={mediaMode}
          meetingId={meetingId}
          officeId={officeId}
          userId={userId}
          name={name}
          position={position}
          players={players}
          onLeave={() => setMediaMode(null)}
        />
      )}
      <div className="office-touch" aria-label="Movimentação por toque">
        {["w", "a", "s", "d"].map((k, i) => (
          <button
            key={k}
            aria-label={
              [
                "Mover para frente",
                "Mover para esquerda",
                "Mover para trás",
                "Mover para direita",
              ][i]
            }
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
            }}
            onPointerUp={() =>
              window.dispatchEvent(new KeyboardEvent("keyup", { key: k }))
            }
            onPointerCancel={() =>
              window.dispatchEvent(new KeyboardEvent("keyup", { key: k }))
            }
          >
            {["↑", "←", "↓", "→"][i]}
          </button>
        ))}
      </div>
      {!joined && (
        <div className="overlay-hint">
          Experiência web 3D • Multiplayer • Reuniões
        </div>
      )}
    </main>
  );
}
