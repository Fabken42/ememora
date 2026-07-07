import { Frown, Angry, Annoyed, Meh, Smile, Laugh, SmilePlus } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ElementType } from "react";

const STATUS_CONFIG: { Icon: ElementType<LucideProps>; className: string; label: string }[] = [
  { Icon: Angry,     className: "text-red-600",     label: "Não lembro" },
  { Icon: Frown,     className: "text-rose-500",    label: "Muito difícil" },
  { Icon: Annoyed,   className: "text-orange-500",  label: "Difícil" },
  { Icon: Meh,       className: "text-yellow-300",   label: "Neutro" },
  { Icon: Smile,     className: "text-lime-500",    label: "Bom" },
  { Icon: Laugh,     className: "text-emerald-500",   label: "Ótimo" },
  { Icon: SmilePlus,     className: "text-indigo-600",  label: "Dominado" },
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