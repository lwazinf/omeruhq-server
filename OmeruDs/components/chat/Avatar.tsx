import React from "react";
import { Avatar as AvatarType } from "@/lib/types";

export default function Avatar({
  avatar,
  name,
  size = 40,
}: {
  avatar?: AvatarType;
  name: string;
  size?: number;
}) {
  const initials =
    avatar?.initials ??
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  if (avatar?.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatar.image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        background: avatar?.color ?? "#6a7175",
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
