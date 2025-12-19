"use client";

import { useState, useEffect } from "react";

export const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const update = () => setIsMobile(mq.matches);
    update();

    mq.addEventListener("change", update);

    return () => {
      mq.removeEventListener("change", update);
    };
  }, [breakpoint]);

  return isMobile;
};
