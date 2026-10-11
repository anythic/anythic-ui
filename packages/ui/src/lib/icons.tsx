import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 4l4 4-4 4" />
  </Icon>
);

export const CircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="8" cy="8" r="5.5" strokeDasharray="2 2" />
  </Icon>
);

export const SpinnerIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Icon>
);

export const CrossIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </Icon>
);
