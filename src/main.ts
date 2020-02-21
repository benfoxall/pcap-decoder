
type Provider = (size: number) => Promise<Uint8Array>;

import {parseGlobalHeader, parseHeader} from './parse'


export async function * parse(read: Provider) {

  yield parseGlobalHeader(await read(6 * 4));

  while(true) {

    const head = parseHeader(await read(4 * 4))

    const body = await read(head.orig_len)

    yield [head, body]

  }

}



// 6 * 32

// typedef struct pcap_hdr_s {
//   guint32 magic_number;   /* magic number */
//   guint16 version_major;  /* major version number */
//   guint16 version_minor;  /* minor version number */
//   gint32  thiszone;       /* GMT to local correction */
//   guint32 sigfigs;        /* accuracy of timestamps */
//   guint32 snaplen;        /* max length of captured packets, in octets */
//   guint32 network;        /* data link type */
// } pcap_hdr_t;


// 4 * 32

// typedef struct pcaprec_hdr_s {
//   guint32 ts_sec;         /* timestamp seconds */
//   guint32 ts_usec;        /* timestamp microseconds */
//   guint32 incl_len;       /* number of octets of packet saved in file */
//   guint32 orig_len;       /* actual length of packet */
// } pcaprec_hdr_t;


// function parseGlobalHeader(buffer: Uint8Array): any {}
// function parseHeader(buffer: Uint8Array): any {}


const reader = () => {

}