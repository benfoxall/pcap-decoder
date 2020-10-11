import Decoder from './decoder';
import { expect } from 'chai';

describe("Decoder", () => {

  describe("empty file", () => {
    const decode = new Decoder();
    const result = decode.decode(new Uint8Array([]));

    it("returns zero packets", () => {
      const arr = Array.from(result);

      expect(arr.length).equal(0);
    })

  })

})
