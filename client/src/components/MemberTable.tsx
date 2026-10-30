import type { MemberRow } from "../types";
import { date } from "../lib/format";
import { Avatar, StatusBadge } from "./ui";
import { Link } from "react-router-dom";

export function MemberTable({
  members,
  organizationId,
}: {
  members: MemberRow[];
  organizationId: string;
}) {
  return (
    <div className="table-scroll">
      <table className="member-table">
        <caption className="sr-only">Club membership records</caption>
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Status</th>
            <th scope="col">Joined</th>
            <th scope="col">Expires</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <div className="table-person">
                  <Avatar name={member.user.name} />
                  <div>
                    <Link
                      className="member-name-link"
                      to={`/app/${organizationId}/members/${member.id}`}
                      aria-label={`Manage membership for ${member.user.name}`}
                    >
                      <strong>{member.user.name}</strong>
                    </Link>
                    <small>{member.user.email}</small>
                  </div>
                </div>
              </td>
              <td>
                <StatusBadge status={member.status} />
              </td>
              <td>{date(member.joinedAt)}</td>
              <td>{date(member.expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
