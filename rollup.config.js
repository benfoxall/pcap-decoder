import typescript from "rollup-plugin-typescript2";

export default {
  input: ["src/reader.ts", "src/nodeStream.ts", "src/webStream.ts"],
  output: {
    dir: "dist",
    format: "es",
  },
  external: ["stream", "fs"],
  plugins: [typescript()],
};
