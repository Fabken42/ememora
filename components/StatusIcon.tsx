import { Angry, Cry, Embarrassed, Joyful, Smile, Cool, Loveface } from "@tiktok-emojis/react";
import type { ComponentType } from "react";

type EmojiProps = Partial<Record<"width" | "height" | "size", string | number>>;

const STATUS_CONFIG: { Emoji: ComponentType<EmojiProps>; label: string }[] = [
  { Emoji: Cry,    label: "Não lembro" },
  { Emoji: Angry,      label: "Muito difícil" },
  { Emoji: Embarrassed,     label: "Difícil" },
  { Emoji: Smile, label: "Neutro" },
  { Emoji: Joyful,    label: "Bom" },
  { Emoji: Cool,    label: "Ótimo" },
  { Emoji: Loveface,     label: "Dominado" },
];

export { STATUS_CONFIG };

interface Props {
  status: number;
  size?: number;
}

export default function StatusIcon({ status, size = 22 }: Props) {
  const cfg = STATUS_CONFIG[Math.max(0, Math.min(6, status))] ?? STATUS_CONFIG[3];
  const { Emoji, label } = cfg;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center leading-none align-middle"
    >
      <Emoji size={size} />
    </span>
  );
}
