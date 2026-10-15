"use client";
import { useEffect, useState } from "react";
import { authHeaders } from "@/lib/auth/client";
import { Room, Track } from "livekit-client";
import {
  RoomContext,
  AudioTrack,
  useTracks,
  VideoConference,
} from "@livekit/components-react";
import {
  distanceVolume,
  type MediaMode,
  type OnlinePlayer,
  type Position,
} from "@/lib/types";

type Props = {
  meetingId?: string;
  mode: MediaMode;
  officeId: string;
  userId: string;
  name: string;
  position: Position;
  players: OnlinePlayer[];
  onLeave: () => void;
};
function SpatialAudio({
  position,
  players,
}: {
  position: Position;
  players: OnlinePlayer[];
}) {
  const refs = useTracks([Track.Source.Microphone]);
  return (
    <div aria-hidden style={{ display: "none" }}>
      {refs
        .filter((ref) => !ref.participant.isLocal)
        .map((ref) => {
          const remote = players.find(
            (p) => p.userId === ref.participant.identity,
          );
          const vol = remote ? distanceVolume(position, remote) : 0;
          return (
            <AudioTrack
              key={ref.participant.identity}
              trackRef={ref}
              volume={vol}
              muted={vol === 0}
            />
          );
        })}
    </div>
  );
}
export default function VoiceManager({
  mode,
  meetingId,
  officeId,
  userId,
  name,
  position,
  players,
  onLeave,
}: Props) {
  const [room] = useState(
    () => new Room({ adaptiveStream: true, dynacast: true }),
  );
  const [state, setState] = useState("Conectando à comunicação...");
  const [mic, setMic] = useState(false);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let alive = true;
    const connect = async () => {
      try {
        setState("Conectando à comunicação...");
        const r = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({ mode, officeId, userId, name, meetingId }),
        });
        const response = await r.json();
        if (!r.ok)
          throw new Error(response.error ?? "Não foi possível obter token");
        if (!alive) return;
        await room.connect(response.serverUrl, response.token);
        if (!alive) {
          await room.disconnect();
          return;
        }
        setConnected(true);
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setMic(true);
        } catch {
          setMic(false);
          setState(
            "Conectado. Permita o microfone nas configurações do navegador.",
          );
          return;
        }
        setState("Conectado");
      } catch (error) {
        if (alive)
          setState(
            error instanceof Error ? error.message : "Erro ao conectar áudio",
          );
      }
    };
    void connect();
    return () => {
      alive = false;
      void room.disconnect();
    };
  }, [room, officeId, userId, name, mode, meetingId]);
  const toggleMic = async () => {
    const value = !mic;
    try {
      await room.localParticipant.setMicrophoneEnabled(value);
      setMic(value);
    } catch {
      setState("Não foi possível acessar o microfone");
    }
  };
  return (
    <RoomContext.Provider value={room}>
      {mode === "office" ? (
        <>
          <SpatialAudio position={position} players={players} />
          <div className="voice-status">
            <span className="live-dot" />
            {state}
            <button
              disabled={!connected}
              onClick={toggleMic}
              aria-label={mic ? "Desativar microfone" : "Ativar microfone"}
            >
              {mic ? "Silenciar" : "Ativar microfone"}
            </button>
            <button onClick={onLeave}>Sair do áudio</button>
          </div>
        </>
      ) : (
        <div className="meeting-screen">
          <div className="meeting-top">
            <div>
              <span className="eyebrow">
                {officeId === "azzo-hq"
                  ? "REUNIÃO · DEMONSTRAÇÃO LOCAL"
                  : "SALA DE REUNIÃO"}
              </span>
              <h2>Reunião estratégica</h2>
              <small>{state}</small>
            </div>
            <button className="leave-meeting" onClick={onLeave}>
              Sair da reunião ×
            </button>
          </div>
          <div className="meeting-video">
            {connected ? (
              <VideoConference />
            ) : (
              <div className="media-unavailable" role="status">
                {state}
                <p>Você pode continuar explorando o escritório.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </RoomContext.Provider>
  );
}
