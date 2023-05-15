import { type FC, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  small?: boolean;
  gray?: boolean;
}

export const Button: FC<ButtonProps> = ({ small, gray, ...props }) => {
  const sizeClasses = small ? "px-2 py-1" : "px-4 py-2 font-bold";
  const grayClasses = gray
    ? "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-300"
    : "bg-blue-500 hover:bg-blue-400 focus-visible:bg-blue-400";

  return (
    <button
      {...props}
      className={`rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${grayClasses} ${
        props.className ?? ""
      }`}
    />
  );
};

Button.defaultProps = {
  small: false,
  gray: false,
};
