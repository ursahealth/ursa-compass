"use client";

import React, { useState } from "react";

const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex items-center">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full z-10 mb-2 rounded-md bg-gray-700 px-3 py-1 text-sm text-white">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
