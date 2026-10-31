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
  const resource = useResource<{ publicDemo?: DemoCredentials }>("/config");
  const demo = resource.data?.publicDemo;
  if (!demo) return null;
  return (
    <section className="public-demo-panel" aria-label="Public demo accounts">
      <h3>Try ClubOS</h3>
      <p>
        Explore with a shared fictional account. Changes are visible to other
        visitors.
      </p>
      <p>
        Public demo password: <code>{demo.password}</code>
      </p>
      <div className="public-demo-actions">
        {demo.accounts.slice(0, 2).map((account, index) => (
          <div key={account.email}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChoose(account.email, demo.password)}
            >
              {index === 0 ? "Try administrator" : "Try member"}
            </Button>
            <small>{account.email}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
