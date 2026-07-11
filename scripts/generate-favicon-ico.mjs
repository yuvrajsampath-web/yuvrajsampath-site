// One-off generator for src/app/favicon.ico -- some browsers request this
// exact path directly regardless of the <link rel="icon"> tag pointing at
// icon.tsx, so we keep a real file here too, wrapping the same PNG design
// in a minimal single-image ICO container (the standard "PNG-in-ICO" trick,
// supported by all modern browsers).
import { ImageResponse } from "@vercel/og";
import { writeFileSync } from "node:fs";

const size = 64;

const res = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      children: {
        type: "div",
        props: {
          style: {
            display: "flex",
            width: size - 6,
            height: size - 6,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#c1652a",
            border: "3px solid #ffffff",
            transform: "rotate(-6deg)",
          },
          children: {
            type: "span",
            props: {
              style: {
                fontSize: size * 0.42,
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "Georgia, serif",
                letterSpacing: -1,
              },
              children: "YS",
            },
          },
        },
      },
    },
  },
  { width: size, height: size }
);

const pngBuffer = Buffer.from(await res.arrayBuffer());

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(size >= 256 ? 0 : size, 0);
dirEntry.writeUInt8(size >= 256 ? 0 : size, 1);
dirEntry.writeUInt8(0, 2);
dirEntry.writeUInt8(0, 3);
dirEntry.writeUInt16LE(1, 4);
dirEntry.writeUInt16LE(32, 6);
dirEntry.writeUInt32LE(pngBuffer.length, 8);
dirEntry.writeUInt32LE(22, 12);

const ico = Buffer.concat([icoHeader, dirEntry, pngBuffer]);
writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), ico);
console.log(`Wrote favicon.ico (${ico.length} bytes)`);
