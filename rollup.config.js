import typescript from "rollup-plugin-typescript2";

export default {
  input: ["src/decoder.ts", "src/nodeStream.ts", "src/webStream.ts"],
  output: {
    dir: "dist",
    format: "es",
  },
  external: ["stream", "fs"],
  plugins: [typescript()],
};
