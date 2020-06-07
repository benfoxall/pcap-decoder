import {
  parseGlobalHeader,
  parsePacketHeader,
  PacketHeader,
  GlobalHeader,
} from "./parse";

class Parser {
  header: GlobalHeader;

  private data = new Uint8Array(0);
  private packetHeader: PacketHeader;

  /** consume a chunk, return any packets found */
  *parse(chunk: Uint8Array | ArrayBuffer) {
    if (chunk instanceof ArrayBuffer) {
      return this.parse(new Uint8Array(chunk));
    }

    this.append(chunk);

    if (!this.header) {
      const data = this.read(24);

      if (data) {
        this.header = parseGlobalHeader(data);
      } else {
        return;
      }
    }

    while (true) {
      if (!this.packetHeader) {
        const data = this.read(16);
        if (data) {
          this.packetHeader = parsePacketHeader(
            data,
            this.header.little_endian
          );
        } else {
          return;
        }
      }

      const body = this.read(this.packetHeader.incl_len);

      if (body) {
        const header = this.packetHeader;
        this.packetHeader = null;

        yield {
          header,
          body,
        };
      } else {
        return;
      }
    }
  }

  private has(len: number) {
    return this.data.length < len;
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

import { Transform } from "stream";

class NodeTransform extends Transform {
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

const transformer = new NodeTransform();

transformer.on("data", (value) => {
  console.log("\n📦", value.header);
});

transformer.on("end", () => {
  console.log("ended");
});

createReadStream("./sample-files/ipp.pcap").pipe(transformer);
