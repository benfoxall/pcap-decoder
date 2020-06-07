// Based from https://mdn.github.io/dom-examples/streams/simple-pump/

import { Reader, Packet } from "./reader";

fetch("./tortoise.png")
  // Retrieve its body as ReadableStream
  .then((response) => response.body)
  .then((rs) => {
    if (rs) {
      const reader = rs.getReader();

      const s2 = WebStream(reader);

      const x2 = s2.getReader();

      x2.read().then((e) => {
        // e.value?.header.
      });
    }
  });

const WebStream = (reader: ReadableStreamDefaultReader<Uint8Array>) => {
  const parser = new Reader();

  return new ReadableStream<Packet>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          for (const packet of parser.parse(value)) {
            controller.enqueue(packet);
          }
        }
      }

      // Close the stream
      controller.close();
      reader.releaseLock();
    },
  });
};

export default WebStream;
