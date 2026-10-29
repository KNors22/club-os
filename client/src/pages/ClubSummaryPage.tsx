import { useOrganization } from "../contexts/clubs-context";
import { money } from "../lib/format";
export function ClubSummaryPage(){const club=useOrganization();return <><div className="page-heading"><div><h1>{club.name}</h1><p>{club.description}</p></div></div><section className="panel plan-card"><h2>{money(club.feeCents)} CAD</h2><p>{club.termDays}-day club membership</p>{club.role==="admin"?<><h3>Share your join code</h3><code>{club.joinCode}</code></>:<p>You have joined this club. Your membership is awaiting payment.</p>}</section></>;}
