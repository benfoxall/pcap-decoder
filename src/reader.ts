export interface Packet {
  header: PacketHeader;
  body: Uint8Array;
}

export default class Reader {
  header?: GlobalHeader;

  private data = new Uint8Array(0);
  private packetHeader?: PacketHeader;

  /** consume a chunk, return any packets found */
  *parse(chunk: Uint8Array): Generator<Packet> {
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

/** Assert things should be a particular way */
function invariant(condition: any, message: string = ""): asserts condition {
  if (!condition) throw new Error(`Invariant Violation: ${message}`);
}

interface GlobalHeader {
  /** major version number */
  version_major: number;
  /** minor version number */
  version_minor: number;
  /** GMT to local correction */
  thiszone: number;
  /** accuracy of timestamps  */
  sigfigs: number;
  /** max length of captured packets, in octets */
  snaplen: number;
  /** data link type */
  network: number;

  little_endian: boolean;
}

const parseGlobalHeader = (u8: Uint8Array): GlobalHeader => {
  invariant(u8.byteLength === 6 * 4, "Expected 24 bytes");

  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

  const magic = view.getUint32(0);
  let little_endian = false;

  switch (magic) {
    case 0xa1b2c3d4:
      break;
    case 0xd4c3b2a1:
      little_endian = true;
      break;
    default:
      throw new Error("Unknown file format");
  }

  return {
    version_major: view.getUint16(4, little_endian),
    version_minor: view.getUint16(6, little_endian),
    thiszone: view.getInt32(8, little_endian),
    sigfigs: view.getUint32(12, little_endian),
    snaplen: view.getUint32(16, little_endian),
    network: view.getUint32(20, little_endian),

    little_endian,
  };
};

interface PacketHeader {
  /** timestamp seconds */
  ts_sec: number;
  /** timestamp microseconds */
  ts_usec: number;
  /** number of octets of packet saved in file */
  incl_len: number;
  /** actual length of packet */
  orig_len: number;
}

const parsePacketHeader = (u8: Uint8Array, endian: boolean): PacketHeader => {
  invariant(u8.byteLength === 4 * 4, "Expected 16 bytes");

  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

  return {
    ts_sec: view.getUint32(0, endian),
    ts_usec: view.getUint32(4, endian),
    incl_len: view.getUint32(8, endian),
    orig_len: view.getUint32(12, endian),
  };
};
