export default function Home() {
  return (
    <main style={{ padding: "3rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Sexual Integrity Program</h1>

      <p>
        A structured 16-week recovery program for men breaking free from
        compulsive sexual behavior.
      </p>

      <p>
        Please sign in or create an account to begin.
      </p>

      <div style={{ marginTop: 20 }}>
        <a href="/login">Sign In</a>
        {" | "}
        <a href="/register">Create Account</a>
      </div>
    </main>
  );
}
