# 📦 pcap decoder

Decode .pcap files and streams.

## Base usage

You can decode chunks of `ArrayBuffer` or `Uint8Array`:

```ts
import Decoder from "pcap-decoder";

const decoder = new Decoder();

for (const packet of decoder.decode(data)) {
  // packet.header ← An object with timestamps
  // packet.body ← A Uint8Array of the packet body
}
```

## Web Streams

There's a wrapper for use with the [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API), which can be useful for handling larger files.

```ts
import webStream from "pcap-decoder/dist/webStream.js";

(() => {
  const response = await fetch("./your-file.pcap");

  const stream = webStream(response.body);

  // read the first packet
  const { value } = await stream.getReader().read();

  // then stop the stream
  stream.cancel();
})();
```

## Node streams

There's also a wrapper for node streams, which creates a transform stream, which reads in object mode.

```js
import { createReadStream } from "fs";
import nodeStream from "pcap-decoder/dist/nodeStream.js";

const transformer = new NodeStream();

transformer.on("data", (value) => {
  // value = {header, body}
});

createReadStream("./sample-files/ipp.pcap").pipe(transformer);
```
