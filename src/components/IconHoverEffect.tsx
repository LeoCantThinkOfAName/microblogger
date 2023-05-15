import { type PropsWithChildren, type FC } from "react";

interface IconHoverEffectProps extends PropsWithChildren {
  red?: boolean;
}

export const IconHoverEffect: FC<IconHoverEffectProps> = ({
  children,
  red,
}) => {
  const colorClasses = red
    ? "outline-red-400 hover:bg-red-200 groupp-hover-bg-red-200 group-focus-visible:bg-red-200"
    : "outline-gray-400 hover:bg-gray-200 groupp-hover-bg-gray-200 group-focus-visible:bg-gray-200";
  return (
    <div
      className={`rounded-full p-2 transition-colors duration-200 ${colorClasses}`}
    >
      {children}
    </div>
  );
};

IconHoverEffect.defaultProps = {
  red: false,
};
