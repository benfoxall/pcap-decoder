import {
  parseGlobalHeader,
  parsePacketHeader,
  PacketHeader,
  GlobalHeader,
} from "./parse";

class Parser {
  private data = new Uint8Array(0);
  private header: GlobalHeader;

  private packetHeader: PacketHeader;

  /** consume a chunk, return any packets found */
  *parse(chunk: Uint8Array) {
    this.append(chunk);

    if (!this.header) {
      const data = this.read(24);
      if (data === null) return;

      this.header = parseGlobalHeader(data);
    }

    while (true) {
      if (!this.packetHeader) {
        const he = this.read(16);
        if (he === null) break;

        this.packetHeader = parsePacketHeader(he, this.header.little_endian);
      }

      const body = this.read(this.packetHeader.incl_len);

      if (body === null) break;

      const header = this.packetHeader;
      this.packetHeader = null;

      yield {
        header,
        body,
      };
    }
  }

  // try to read bytes from data
  private read(len: number) {
    if (this.data.length < len) {
      return null;
    }

    // this should be fairly cheap because it's
    // data views rather than the buffer
    const p1 = this.data.subarray(0, len);
    this.data = this.data.subarray(len);

    return p1;
  }

  private append(chunk: Uint8Array) {
    // this could be nicer
    const appended = new Uint8Array(this.data.length + chunk.length);
    appended.set(this.data);
    appended.set(chunk, this.data.length);
    this.data = appended;
  }
}

import { Transform } from "stream";

class MyTransform extends Transform {
  private parser = new Parser();

  constructor() {
    super({ readableObjectMode: true });
  }

  _transform(data, encoding: string, callback) {
    if (!Buffer.isBuffer(data)) {
      return callback(new Error("Expected Buffer"));
    }

    const u8 = new Uint8Array(data);

    for (const packet of this.parser.parse(u8)) {
      this.push(packet);
    }

    callback();
  }

  _flush(callback) {
    callback();
  }
}

// Test script
import { createReadStream } from "fs";

const file = createReadStream("./sample-files/ipp.pcap");

const transformer = new MyTransform();

transformer.on("data", (value) => {
  console.log("\n📦", value.header);
});

transformer.on("end", () => {
  console.log("ended");
});

file.pipe(transformer);
