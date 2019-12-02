import {expect} from 'chai'
import { compress, decompress } from "../../lib/utils/compress"

describe('compression', () => {
    it('test', async () => {
        const text = '233'.repeat(1000)
        const raw = new TextEncoder().encode(text)
        const size1 = raw.byteLength
        const compressed = await compress(raw)
        const size2 = compressed.byteLength
        const result = await decompress(compressed)
        expect(size2).lt(size1)
        expect(new TextDecoder().decode(result)).eq(text)
    })
})