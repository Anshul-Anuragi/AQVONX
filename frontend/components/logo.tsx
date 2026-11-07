import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
  asLink?: boolean;
  variant?: "icon" | "logo";
}

/**
 * Renders the exact geometric paths from /public/icon.svg (viewBox="0 0 677 512")
 * with currentColor support for dark/light theme adaptability.
 */
export function AQVONXIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 677 512"
      className={className}
      fill="currentColor"
      stroke="currentColor"
    >
      <g id="object-1" transform="translate(6 8)">
        <path
          strokeWidth="1"
          d="M 657.5 0 L 658 2.5 L 604 189 Q 601.3 190.1 602 187.5 L 557.5 134 Q 476.5 201.5 381.5 255 L 315.5 289 L 277.5 306 L 205.5 334 L 163.5 347 Q 139 357 123 375.5 L 109 395.5 L 88 434.5 L 89.5 434 L 128.5 410 Q 148 400.5 170.5 394 L 211.5 386 L 221.5 386 L 222.5 385 L 258.5 385 L 259.5 386 L 269.5 386 L 270.5 387 L 285.5 388 L 316.5 394 L 375.5 410 L 412.5 422 L 456.5 432 L 462.5 432 L 470.5 434 L 479.5 434 L 480.5 435 L 520.5 435 L 521.5 434 L 529.5 434 L 546.5 431 L 571.5 423 Q 589 415.5 601 402.5 L 609 388.5 Q 611.3 381.8 610 371.5 Q 606.9 357.1 596.5 350 Q 581.6 338.4 554.5 339 Q 552.8 341.8 546.5 340 L 546.5 339 Q 557.2 332.7 571.5 330 Q 576.2 331.3 577.5 329 L 598.5 329 L 617.5 334 L 627.5 339 L 643 352.5 Q 650.1 360.4 653 372.5 L 654 377.5 L 654 395.5 Q 647.3 425.8 625.5 441 L 599.5 457 L 564.5 470 L 527.5 477 L 517.5 477 L 516.5 478 L 486.5 478 L 485.5 477 L 474.5 477 L 473.5 476 L 466.5 476 L 465.5 475 L 447.5 473 L 412.5 465 L 353.5 447 L 309.5 431 L 271.5 421 L 242.5 416 L 232.5 416 L 231.5 415 L 196.5 415 L 195.5 416 L 186.5 416 L 185.5 417 L 173.5 418 L 156.5 422 L 123.5 434 Q 92.3 448.3 68.5 470 L 0 470 L 4 460.5 L 61 357.5 Q 73.9 337.9 91.5 323 Q 110.9 306.9 135.5 296 L 231.5 262 L 282.5 240 L 326.5 218 Q 427.7 163.7 513 93.5 L 511.5 91 L 460 51.5 L 465.5 49 L 516.5 37 L 535.5 31 L 594.5 17 L 598.5 15 L 657.5 0 Z "
        />
      </g>
      <g id="object-2" transform="translate(103 29)">
        <path
          strokeWidth="1"
          d="M 174.5 0 L 190.5 0 L 202.5 3 Q 219.3 9.7 229 23.5 L 239 42.5 L 281 143 L 228.5 173 L 183 65 L 180 66.5 L 88.5 236 L 36.5 253 Q 16.6 261.6 0.5 274 L 0 272.5 L 130 30.5 L 142.5 15 Q 149.5 8 159.5 4 L 174.5 0 Z "
        />
      </g>
      <g id="object-3" transform="translate(370 170)">
        <path
          strokeWidth="1"
          d="M 186.5 0 L 227 51.5 L 138 208.5 Q 130.8 221.3 119.5 230 Q 111.4 236.4 99.5 239 L 94.5 240 L 78.5 240 Q 54 235 41 218.5 L 31 202.5 L 0 126.5 L 53 97 L 75 151.5 L 86.5 176 L 186.5 0 Z "
        />
      </g>
      <g id="object-4" transform="translate(133 445)">
        <path
          strokeWidth="1"
          d="M 72.5 0 L 101.5 0 L 102.5 1 L 110.5 1 L 137.5 6 L 173.5 16 L 207.5 29 L 259.5 46 L 292 53.5 L 289.5 55 L 270.5 56 L 269.5 57 L 238.5 57 L 237.5 56 L 225.5 56 L 224.5 55 L 212.5 54 L 185.5 48 L 117.5 26 L 92.5 20 L 79.5 19 L 78.5 18 L 68.5 18 L 67.5 17 L 36.5 17 L 35.5 18 L 26.5 18 L 0.5 23 L 0.5 22 L 28.5 9 L 46.5 4 L 62.5 1 L 71.5 1 L 72.5 0 Z "
        />
      </g>
      <g id="object-5" transform="translate(488 368)">
        <path
          strokeWidth="1"
          d="M 67.5 0 Q 86.9 -1.4 95 8.5 Q 99.5 13 99 22.5 Q 97 32.5 89.5 37 L 75.5 45 L 50.5 53 L 38.5 54 L 37.5 55 L 11.5 55 L 0 52.5 Q 23.7 48.7 43.5 41 L 59.5 33 L 66 27.5 Q 70.5 24 69 14.5 L 65.5 10 L 60.5 7 L 51 4.5 L 56.5 2 L 67.5 0 Z "
        />
      </g>
    </svg>
  );
}

/**
 * Renders the exact geometric paths from /public/logo.svg (viewBox="0 0 800 800")
 * with currentColor support for dark/light theme adaptability.
 */
export function AQVONXLogoMark({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      className={className}
      fill="currentColor"
      stroke="currentColor"
    >
      <g id="object-1" transform="translate(88 250)">
        <path
          strokeWidth="1"
          d="M 264 0 L 329.5 0 L 331 1.5 L 349 43.5 L 350 49 L 352.5 49 L 388.5 31 L 386.5 34 Q 384.3 33.3 385 35.5 L 370 48 L 368.5 51 L 366 52.5 Q 366.8 54.8 364.5 54 L 357 61.5 L 357 64.5 L 412 195.5 L 380.5 263 L 368 237.5 L 312 109 L 299 119 L 297.5 122 Q 272.7 145.2 244.5 165 Q 218.4 183.4 187.5 197 L 186 196.5 Q 186.8 198.8 184.5 198 L 171.5 204 L 148.5 211 L 128.5 215 L 121.5 215 L 117.5 214 L 114 216 L 102 247.5 L 86.5 281 L 25.5 281 L 23 282 L 53 213.5 L 54 208.5 L 18 165.5 L 0 139.5 L 1.5 140 Q 25.3 153.7 54.5 162 L 85.5 168 L 116.5 169 L 117.5 168 L 141.5 166 L 146.5 164 L 159.5 162 L 182.5 155 L 209.5 144 L 253.5 120 L 302 86.5 L 264 0 Z "
        />
      </g>
      <g id="object-2" transform="translate(478 246)">
        <path
          strokeWidth="1"
          d="M 133.5 0 L 154.5 0 L 155.5 1 L 166.5 1 L 167.5 2 L 175.5 2 L 187 4 L 64.5 285 L 3.5 285 L 3 283.5 L 38 205.5 L 104 51.5 L 91.5 49 L 69.5 49 L 68.5 50 L 51.5 52 L 31.5 58 L 13.5 66 L 0.5 75 L 0 73.5 Q 13.2 53.2 31.5 38 Q 51.7 20.2 79.5 10 L 112.5 2 L 132.5 1 L 133.5 0 Z "
        />
      </g>
      <g id="object-3" transform="translate(170 250)">
        <path
          strokeWidth="1"
          d="M 67.5 0 L 131.5 0 L 132 2.5 L 165 76.5 L 167 78.5 L 175 99 L 136.5 122 L 126 126 L 105 76.5 L 104 71.5 L 98.5 61 L 62 148 L 39.5 152 L 15.5 153 L 14.5 152 Q 5.3 153.3 0 150.5 L 64 5.5 L 67.5 0 Z "
        />
      </g>
      <g id="object-4" transform="translate(323 406)">
        <path
          strokeWidth="1"
          d="M 48.5 0 L 105 125.5 L 103.5 125 L 40.5 125 L 39 123.5 L 0 34.5 Q 27.2 20.2 48.5 0 Z "
        />
      </g>
    </svg>
  );
}

export function Logo({
  size = "md",
  showWordmark = true,
  className = "",
  asLink = true,
  variant = "logo",
}: LogoProps) {
  const dimensions = {
    sm: { box: "w-7 h-7 p-1", icon: "w-5 h-5", text: "text-base", sub: "text-[9px]" },
    md: { box: "w-9 h-9 p-1.5", icon: "w-6 h-6", text: "text-lg sm:text-xl", sub: "text-[10px]" },
    lg: { box: "w-12 h-12 p-2", icon: "w-8 h-8", text: "text-2xl", sub: "text-xs" },
    xl: { box: "w-16 h-16 p-2.5", icon: "w-11 h-11", text: "text-3xl", sub: "text-sm" },
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      {/* Brand Icon Mark */}
      <div
        className={`${dimensions.box} rounded-xl purple-glass-pill flex items-center justify-center text-white dark:text-white shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_22px_rgba(168,85,247,0.6)] group-hover:border-purple-400 transition-all duration-300`}
      >
        {variant === "icon" ? (
          <AQVONXIcon className={dimensions.icon} />
        ) : (
          <AQVONXLogoMark className={dimensions.icon} />
        )}
      </div>

      {/* Brand Typography */}
      {showWordmark && (
        <span className={`${dimensions.text} font-bold tracking-tight text-[var(--text-main)] flex items-baseline gap-0.5`}>
          AQVONX<span className="text-purple-400 font-normal">.studio</span>
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
