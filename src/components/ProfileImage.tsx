import Image from "next/image";
import { type FC } from "react";
import { VscAccount } from "react-icons/vsc";

interface ProfileImageProps {
  src?: string | null;
  className?: string;
}

export const ProfileImage: FC<ProfileImageProps> = ({ src, className }) => {
  return (
    <div
      className={`relative h-12 w-12 overflow-hidden rounded-full ${
        className ?? ""
      }`}
    >
      {src ? (
        <Image
          loading="lazy"
          src={src}
          alt="Profile Image"
          quality={100}
          fill
          sizes="100px"
          placeholder="blur"
          blurDataURL="data:image/webp;base64,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"
        />
      ) : (
        <VscAccount className="h-full w-full" />
      )}
    </div>
  );
};