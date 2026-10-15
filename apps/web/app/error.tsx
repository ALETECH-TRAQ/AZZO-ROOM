"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <h1>Não conseguimos abrir este espaço.</h1>
        <p>
          Verifique sua conexão e o suporte a WebGL do navegador para a
          experiência 3D.
        </p>
        <button className="primary-cta" onClick={reset}>
          Tentar novamente
        </button>
        <p>
          <a href="/login">Voltar ao início</a>
        </p>
      </section>
    </main>
  );
}
