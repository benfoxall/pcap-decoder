// Based from https://mdn.github.io/dom-examples/streams/simple-pump/

import Reader, { Packet } from "./reader";

const stream = (stream: ReadableStream<Uint8Array> | null) => {
  if (stream === null) return null;

  const reader = stream.getReader();

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

export default stream;

/*
// Example usage

fetch("./tortoise.png")
  // Retrieve its body as ReadableStream
  .then((response) => stream(response.body))

  .then(async (rs) => {
    if (rs) {
      const reader = rs.getReader();

      reader.read().then((e) => {
        console.log("Packet!", e.value);

        rs.cancel();
      });
    }
  });

//*/
