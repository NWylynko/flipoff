export default function Hero({ onCTA }) {
  return (
    <section className="hero">
      <h1>Turn any TV into a retro split-flap display.</h1>
      <p className="subtitle">The classic flip-board look, without the $3,500 hardware.</p>
      <div className="hero-cta">
        <input type="email" placeholder="you@example.com" />
        <button onClick={onCTA}>Get Early Access</button>
      </div>
    </section>
  )
}
