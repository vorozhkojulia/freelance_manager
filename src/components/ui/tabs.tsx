"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Tab = {
  title: string;
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content?: React.ReactNode;
};

export const Tabs = ({
  tabs: propTabs,
  value,
  onValueChange,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: {
  tabs: Tab[];
  /** Controlled active tab. Omit for uncontrolled. */
  value?: string;
  onValueChange?: (value: string) => void;
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const [internal, setInternal] = useState(propTabs[0].value);
  const activeValue = value ?? internal;
  const active = propTabs.find((t) => t.value === activeValue) ?? propTabs[0];

  // Active tab first: it is the front card of the stack.
  const tabs = useMemo(() => [active, ...propTabs.filter((t) => t.value !== active.value)], [active, propTabs]);

  const [hovering, setHovering] = useState(false);

  const select = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  return (
    <>
      <div
        role="tablist"
        className={cn(
          "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
          containerClassName,
        )}
      >
        {propTabs.map((tab) => {
          const isActive = active.value === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.value}`}
              id={`tab-${tab.value}`}
              onClick={() => select(tab.value)}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className={cn("relative px-4 py-2 rounded-full", tabClassName)}
              data-active={isActive}
              style={{ transformStyle: "preserve-3d" }}
            >
              {isActive && (
                <motion.div
                  layoutId="clickedbutton"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  className={cn("absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full ", activeTabClassName)}
                />
              )}

              <span className="relative flex items-center gap-2">
                {tab.icon}
                {tab.title}
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        key={active.value}
        hovering={hovering}
        className={cn("mt-32", contentClassName)}
      />
    </>
  );
};

export const FadeInDiv = ({
  className,
  tabs,
  hovering,
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}) => {
  const isActive = (tab: Tab) => tab.value === tabs[0].value;
  return (
    <div className="relative isolate w-full flex-1 min-h-0">
      {tabs.map((tab, idx) => (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          role="tabpanel"
          id={`panel-${tab.value}`}
          aria-labelledby={`tab-${tab.value}`}
          inert={!isActive(tab)}
          style={{
            scale: 1 - idx * 0.06,
            top: hovering ? idx * -16 : 0,
            zIndex: -idx,
            opacity: idx < 3 ? 1 - idx * 0.1 : 0,
          }}
          animate={{
            y: isActive(tab) ? [0, 14, 0] : 0,
          }}
          className={cn("w-full h-full absolute top-0 left-0", className)}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
};
