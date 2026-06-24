import { Frown, Angry, Annoyed, Meh, Smile, Laugh, SmilePlus } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ElementType } from "react";

const STATUS_CONFIG: { Icon: ElementType<LucideProps>; className: string; label: string }[] = [
  { Icon: Angry,     className: "text-red-600",     label: "Não lembro" },
  { Icon: Frown,     className: "text-rose-500",    label: "Muito difícil" },
  { Icon: Annoyed,   className: "text-orange-400",  label: "Difícil" },
  { Icon: Meh,       className: "text-yellow-400",   label: "Neutro" },
  { Icon: Smile,     className: "text-lime-500",    label: "Bom" },
  { Icon: Laugh,     className: "text-amber-400",   label: "Ótimo" },
  { Icon: SmilePlus,     className: "text-violet-500",  label: "Dominado" },
];

export { STATUS_CONFIG };

interface Props {
  status: number;
  size?: number;
}

export default function StatusIcon({ status, size = 22 }: Props) {
  const cfg = STATUS_CONFIG[Math.max(0, Math.min(6, status))] ?? STATUS_CONFIG[3];
  const { Icon, className, label } = cfg;
  return (
    <Icon
      size={size}
      className={className}
      aria-label={label}
      strokeWidth={2}
    />
  );
}