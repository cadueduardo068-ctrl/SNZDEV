'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="error-state"><a href="/">SNZ DEV</a><h1>Vamos tentar de novo?</h1><p>Não foi possível carregar esta página agora. Sua ideia continua bem-vinda.</p><button className="button primary" onClick={reset}>Tentar novamente ↻</button></main>}
