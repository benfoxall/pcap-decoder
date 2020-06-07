console.log("--");

import {
  parseGlobalHeader,
  parsePacketHeader,
  PacketHeader,
  GlobalHeader,
} from "./parse";

console.log(parseGlobalHeader);

type Read = (n: number | null) => Promise<Uint8Array>;

const pullStream = (source: ReadStream): Read => {
  const pull = async (n: number) => {
    const first = source.read(n);
    if (first !== null) return new Uint8Array(first);

    await new Promise((resolve) => source.once("readable", resolve));

    return pull(n);
  };

  return pull;
};

async function* pcapReader(read: Read) {
  const globalHeader = parseGlobalHeader(await read(24));
  console.log(globalHeader);

  let i = 6;
  while (i--) {
    const header = parsePacketHeader(
      await read(16),
      globalHeader.little_endian
    );
    const body = await read(header.orig_len);

    yield { ph: header, pb: body };
  }
}

// Test script
import { createReadStream, ReadStream } from "fs";
import { Readable } from "stream";

const file = createReadStream("./sample-files/ipv4frags.pcap");

// file.pipe()

const pull = pullStream(file);

// pcapReader(pull);
(async () => {
  for await (const p of pcapReader(pull)) {
    console.log("Packet!", p);
  }
})();
