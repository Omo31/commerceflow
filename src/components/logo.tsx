import type { SVGProps } from "react";

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_1001_2)">
        <rect width="24" height="24" rx="6" fill="#64B5F6" />
        <path
          d="M8.25 7.5H12C14.0711 7.5 15.75 9.17893 15.75 11.25V11.25C15.75 13.3211 14.0711 15 12 15H10.5M8.25 12H10.5M8.25 7.5V16.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1001_2">
          <rect width="24" height="24" rx="6" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
