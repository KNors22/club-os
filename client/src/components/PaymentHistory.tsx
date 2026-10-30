import type { Payment } from "../types";
import { date, money } from "../lib/format";

export function PaymentHistory({ payments = [] }: { payments?: Payment[] }) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <h2>Payment and renewal history</h2>
          <p>Confirmed payments and the membership periods they cover.</p>
        </div>
      </div>
      {payments.length === 0 ? (
        <div className="empty-state">
          <p>No payments have been recorded yet.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="member-table payment-table">
            <caption className="sr-only">Membership payment history</caption>
            <thead>
              <tr>
                <th scope="col">Received</th>
                <th scope="col">Amount</th>
                <th scope="col">Method / reference</th>
                <th scope="col">Membership period</th>
              </tr>
            </thead>
            <tbody>
              {[...payments].reverse().map((payment) => (
                <tr key={payment.id}>
                  <td>{date(payment.paidAt)}</td>
                  <td>{money(payment.amountCents)} CAD</td>
                  <td>
                    <strong>
                      {payment.method === "e-transfer"
                        ? "E-transfer"
                        : payment.method === "cash"
                          ? "Cash"
                          : "Other"}
                    </strong>
                    <small className="table-secondary">
                      {payment.reference || "No reference"}
                    </small>
                  </td>
                  <td>
                    {date(payment.periodStart)} – {date(payment.periodEnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
