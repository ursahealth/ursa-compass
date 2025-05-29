import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "ui/index.ts",
  output: [
    { dir: "ui/esm", format: "esm", sourcemap: true },
    { dir: "ui/lib", format: "cjs", sourcemap: true },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    json(),
    postcss(),
    typescript({ tsconfig: "./ui/tsconfig.json" }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: ["@babel/preset-react"],
    }),
  ],
  external: ["react", "react-dom"], // don't bundle React itself
};
