import * as React from "react";

import { cn } from "@/lib/utils";

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  items: React.ReactNode[];
}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <ol
        ref={ref}
        className={cn(
          "relative border-l border-gray-200 dark:border-gray-700",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => (
          <li key={index} className="mb-10 ml-4">
            <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
            {item}
          </li>
        ))}
      </ol>
    );
  },
);
Timeline.displayName = "Timeline";

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  time: string;
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, title, time, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600",
          className,
        )}
        {...props}
      >
        <div className="items-center justify-between mb-3 sm:flex">
          <time className="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
            {time}
          </time>
          <div className="text-sm font-normal text-gray-500 lex dark:text-gray-300">
            {title}
          </div>
        </div>
        <div className="p-3 text-xs italic font-normal text-gray-500 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">
          {children}
        </div>
      </div>
    );
  },
);
TimelineItem.displayName = "TimelineItem";

export { Timeline, TimelineItem };
