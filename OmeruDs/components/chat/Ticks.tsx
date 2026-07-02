import React from "react";
import { DeliveryStatus } from "@/lib/types";
import { CheckSingle, CheckDouble, Clock } from "./Icons";

// Read = blue double tick; delivered = grey double; sent = grey single.
export default function Ticks({
  status,
  className = "",
}: {
  status?: DeliveryStatus;
  className?: string;
}) {
  if (!status) return null;
  if (status === "sending")
    return <Clock size={15} className={className} style={{ color: "var(--meta-out)" }} />;
  if (status === "sent")
    return <CheckSingle size={16} className={className} style={{ color: "var(--meta-out)" }} />;
  const color = status === "read" ? "var(--tick)" : "var(--meta-out)";
  return <CheckDouble size={17} className={className} style={{ color }} />;
}
