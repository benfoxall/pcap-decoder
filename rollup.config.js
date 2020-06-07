import typescript from "rollup-plugin-typescript2";

export default {
  input: ["src/main.ts", "src/parse.ts"],
  output: {
    dir: "dist",
    format: "cjs",
  },
  external: ["stream", "fs"],
  plugins: [typescript()],
};
