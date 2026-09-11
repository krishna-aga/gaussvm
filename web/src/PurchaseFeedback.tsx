import { Check } from "lucide-react";

export function PurchaseFeedback({
  side,
  animate,
}: {
  side: "YES" | "NO";
  animate: boolean;
}) {
  return (
    <div
      className={`purchase-feedback ${side.toLowerCase()}${animate ? " animate" : ""}`}
      role="status"
      data-side={side}
    >
      <span className="purchase-token" aria-hidden="true">
        {side}
        <Check size={14} />
      </span>
      <p>
        <strong>You bought {side}</strong>
        <span>
          Swap confirmed. <a href="#transactions">View receipt</a>
        </span>
      </p>
    </div>
  );
}
