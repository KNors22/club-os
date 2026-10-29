import type { MemberRow } from "../types";
import { date } from "../lib/format";
import { Avatar, StatusBadge } from "./ui";

export function MemberTable({ members }: { members: MemberRow[] }) {
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
                    <strong>{member.user.name}</strong>
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
