// Based from https://mdn.github.io/dom-examples/streams/simple-pump/

import Decoder, { Packet } from "./decoder";

const stream = (stream: ReadableStream<Uint8Array> | null) => {
  if (stream === null) return null;

  const reader = stream.getReader();

  const parser = new Decoder();

  return new ReadableStream<Packet>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        // not sure if I should release lock too?
        controller.close();
      }

      if (value) {
        for (const packet of parser.decode(value)) {
          controller.enqueue(packet);
        }
      }
    },

    cancel(reason) {
      reader.cancel();
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
