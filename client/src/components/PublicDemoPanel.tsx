import { useState } from "react";
import { useResource } from "../hooks/useResource";
import { Button } from "./ui";
interface DemoCredentials {
  password: string;
  accounts: { email: string; role: string }[];
}
export function PublicDemoPanel({
  onChoose,
}: {
  onChoose: (email: string, password: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const resource = useResource<{ publicDemo?: DemoCredentials }>("/config");
  const demo = resource.data?.publicDemo;
  if (!demo) return null;
  return (
    <section className="public-demo-panel" aria-label="Public sample accounts">
      <h3>Try ClubOS</h3>
      <p>
        Explore with a shared fictional account. Changes are visible to other
        visitors.
      </p>
      <p>
        Shared password: <code>{demo.password}</code>
      </p>
      <div className="public-demo-actions">
        {demo.accounts.slice(0, 2).map((account, index) => (
          <div key={account.email}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelected(account.email);
                onChoose(account.email, demo.password);
              }}
            >
              {index === 0 ? "Try administrator" : "Try member"}
            </Button>
            <small>{account.email}</small>
          </div>
        ))}
      </div>
      <label className="field-hint" htmlFor="sample-account">
        Explore another account
      </label>
      <select
        id="sample-account"
        className="filter-input"
        value={selected}
        onChange={(event) => {
          const email = event.target.value;
          setSelected(email);
          if (email) onChoose(email, demo.password);
        }}
      >
        <option value="">Choose a sample account</option>
        {demo.accounts.map((account) => (
          <option key={account.email} value={account.email}>
            {account.email} · {account.role}
          </option>
        ))}
      </select>
    </section>
  );
}
