import Image from "next/image";

type DesignImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
};

export function DesignImage({ priority = false, alt, ...props }: DesignImageProps) {
  return <Image {...props} alt={alt} priority={priority} sizes="(max-width: 1000px) 100vw, 640px" />;
}
