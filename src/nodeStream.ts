import Reader from "./reader";

import { Transform, TransformCallback } from "stream";

export class NodeStream extends Transform {
  private parser = new Reader();

  constructor() {
    super({ readableObjectMode: true });
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    if (!Buffer.isBuffer(chunk)) {
      return callback(new Error("Expected Buffer"));
    }

    for (const packet of this.parser.parse(chunk)) {
      this.push(packet);
    }

    callback();
  }

  _flush(callback: TransformCallback) {
    callback();
  }
}

/*
// Example usage
import { createReadStream } from "fs";

const transformer = new NodeStream();

transformer.on("data", (value) => {
  console.log("\n📦", value.header);
});

transformer.on("end", () => {
  console.log("ended");
});

createReadStream("./sample-files/ipp.pcap").pipe(transformer);

// */
