const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'africa.svg');
const outputPath = path.join(__dirname, 'src', 'components', 'ui', 'AfricaMap.tsx');

let svgContent = fs.readFileSync(svgPath, 'utf8');

// Extract the svg body
const svgMatch = svgContent.match(/<svg[^]*?>([^]*?)<\/svg>/);
if (!svgMatch) {
  console.error("Could not find <svg> tags");
  process.exit(1);
}

let body = svgMatch[1];

// Clean up metadata, style tag, etc.
body = body.replace(/<metadata[^]*?>[^]*?<\/metadata>/g, '');
body = body.replace(/<style[^]*?>[^]*?<\/style>/g, '');

// Convert XML attributes to React camelCase
body = body.replace(/class=/g, 'className=');
body = body.replace(/fill-opacity=/g, 'fillOpacity=');
body = body.replace(/stroke-width=/g, 'strokeWidth=');
body = body.replace(/stroke-opacity=/g, 'strokeOpacity=');
body = body.replace(/stroke-miterlimit=/g, 'strokeMiterlimit=');
body = body.replace(/stroke-dasharray=/g, 'strokeDasharray=');
body = body.replace(/fill-rule=/g, 'fillRule=');
body = body.replace(/clip-rule=/g, 'clipRule=');

const reactComponent = `"use client";

import React from "react";

export const AfricaMap: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <style>{\`
        .land {
          fill: #E8E0D8;
          stroke: #C4B8A8;
          stroke-width: 0.8px;
          transition: fill 0.3s ease;
        }
        .land:hover {
          fill: #DFD4C6;
        }
        .tg {
          fill: #B84A2A !important;
          animation: mapPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .circle {
          display: none; /* Hide small country circles for a cleaner map */
        }
        @keyframes mapPulse {
          0%, 100% {
            fill: #B84A2A;
          }
          50% {
            fill: #E26E4F;
          }
        }
      \`}</style>
      ${body}
    </svg>
  );
};
`;

fs.writeFileSync(outputPath, reactComponent);
console.log("Successfully generated AfricaMap.tsx");
