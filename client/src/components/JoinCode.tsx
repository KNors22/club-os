import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "./ui";

export function JoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError("");
    } catch {
      setError("Select the code above to copy it manually.");
    }
  }
  return (
    <section className="invite-panel">
      <div className="invite-icon">
        <KeyRound size={23} />
      </div>
      <div className="invite-body">
        <h2>Bring your people in.</h2>
        <p>Share this code with members so they can join your club.</p>
        <div className="join-code-row">
          <code>{code}</code>
          <Button
            variant="secondary"
            onClick={() => void copy()}
            aria-label="Copy join code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy code"}
          </Button>
        </div>
        {error && <p role="status">{error}</p>}
      </div>
    </section>
  );
}
