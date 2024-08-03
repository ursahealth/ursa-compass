import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default [
  {
    input: "engine/index.js",
    output: [
      {
        dir: "esm",
        format: "esm",
        sourcemap: true,
        entryFileNames: "[name].js",
      },
      {
        dir: "lib",
        format: "cjs",
        sourcemap: true,
        exports: "auto",
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name]-[hash].cjs",
      },
    ],
    plugins: [resolve(), commonjs(), json()],
  },
];
