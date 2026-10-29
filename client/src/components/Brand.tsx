import { Link } from "react-router-dom";
import { Asterisk } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/clubs"
      className={`brand${light ? " brand-light" : ""}`}
      aria-label="ClubOS home"
    >
      <span className="brand-mark">
        <Asterisk size={26} strokeWidth={2.6} />
      </span>
      <span>
        club<span className="brand-os">os</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
