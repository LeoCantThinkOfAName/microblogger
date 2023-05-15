import { type FC } from "react";
import { VscRefresh } from "react-icons/vsc";

interface LoadingSpinnerProps {
  big?: boolean;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ big }) => {
  const sizeClasses = big ? "w-16 h-16" : "w-10 h-10";

  return (
    <div className="flex justify-center p-2">
      <VscRefresh className={`animate-spin ${sizeClasses}`} />
    </div>
  );
};

LoadingSpinner.defaultProps = {
  big: false,
};
