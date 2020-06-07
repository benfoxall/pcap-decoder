import {
  parseGlobalHeader,
  parsePacketHeader,
  PacketHeader,
  GlobalHeader,
} from "./parse";

export class Parser {
  header?: GlobalHeader;

  private data = new Uint8Array(0);
  private packetHeader?: PacketHeader;

  /** consume a chunk, return any packets found */
  *parse(chunk: Uint8Array): any {
    if (chunk instanceof ArrayBuffer) {
      return this.parse(new Uint8Array(chunk));
    }

    this.append(chunk);

    if (!this.header) {
      const data = this.read(24);

      if (!data) return;

      this.header = parseGlobalHeader(data);
    }

    while (true) {
      if (!this.packetHeader) {
        const data = this.read(16);

        if (!data) return;

        this.packetHeader = parsePacketHeader(data, this.header.little_endian);
      }

      const body = this.read(this.packetHeader.incl_len);

      console.log("BOD");

      if (!body) return;

      const header = this.packetHeader;
      this.packetHeader = undefined;

      yield { header, body };
    }
  }

  // try to read bytes from data
  private read(len: number) {
    if (this.data.length < len) {
      return null;
    }

    // this should be fairly cheap because it's
    // data views rather than the buffer
    const target = this.data.subarray(0, len);
    this.data = this.data.subarray(len);

    return target;
  }

  private append(chunk: Uint8Array) {
    // this could be nicer
    const appended = new Uint8Array(this.data.length + chunk.length);
    appended.set(this.data);
    appended.set(chunk, this.data.length);
    this.data = appended;
  }
}

import { Transform, TransformCallback } from "stream";

class NodeStream extends Transform {
  private parser = new Parser();

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

// Test script
import { createReadStream } from "fs";

const transformer = new NodeStream();

transformer.on("data", (value) => {
  console.log("\n📦", value.header);
});

transformer.on("end", () => {
  console.log("ended");
});

createReadStream("./sample-files/ipp.pcap").pipe(transformer);

// nodeStream
// webStream
