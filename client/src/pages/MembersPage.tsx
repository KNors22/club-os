import { useDeferredValue, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { Button, ErrorState, Loading } from "../components/ui";
import { MemberTable } from "../components/MemberTable";
import type { MemberList } from "../types";

export function MembersPage() {
  const organization = useOrganization();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({
    search: deferredSearch,
    status,
    page: String(page),
  });
  const resource = useResource<MemberList>(
    organization.role === "admin"
      ? `/organizations/${organization.id}/memberships?${query}`
      : null,
  );
  if (organization.role !== "admin")
    return <Navigate to={`/app/${organization.id}/membership`} replace />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PEOPLE, IN ONE PLACE</span>
          <h1>
            Members<span className="heading-dot">.</span>
          </h1>
          <p>
            Keep up with the people who make {organization.name} what it is.
          </p>
        </div>
        <div className="heading-icon">
          <UsersRound size={29} />
        </div>
      </div>
      <section className="panel members-panel">
        <div className="member-toolbar">
          <div className="search-input">
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="member-search">
              Search members by name or email
            </label>
            <input
              id="member-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email…"
              maxLength={100}
            />
          </div>
          <div className="filter-input">
            <label htmlFor="member-status">Status</label>
            <select
              id="member-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All memberships</option>
              <option value="pending">Awaiting payment</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        {resource.loading ? (
          <Loading label="Finding your members…" />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.reload} />
        ) : resource.data?.memberships.length ? (
          <>
            <MemberTable members={resource.data.memberships} />
            <div className="pagination">
              <span>
                {resource.data.pagination.total}{" "}
                {resource.data.pagination.total === 1 ? "member" : "members"} ·
                Page {page} of {resource.data.pagination.pages}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= resource.data!.pagination.pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <UsersRound size={30} />
            <h2>
              {search || status !== "all"
                ? "No matches just yet."
                : "Your next chapter starts with people."}
            </h2>
            <p>
              {search || status !== "all"
                ? "Try another name, email, or membership status."
                : "Share the join code from your overview to welcome your first members."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
