import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
export function AppFooter({
  variant = "workspace",
}: {
  variant?: "workspace" | "auth";
}) {
  const [year] = useState(() => new Date().getFullYear());
  return (
    <footer
      className={`app-footer ${variant === "workspace" ? "workspace-footer" : "app-footer-auth"}`}
    >
      <span className="footer-brand">
        ClubOS · Made for student communities.
      </span>
      <div className="footer-credits">
        <span>© {year} Andrey Gonzalez</span>
        <a
          href="https://github.com/KNors22"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Andrey Gonzalez on GitHub"
        >
          GitHub <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
