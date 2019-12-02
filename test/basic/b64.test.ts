import { b64decode, b64encode, urlSafeB64Encode, urlSafeB64Decode } from "../../lib"
import {expect} from 'chai'

describe('base64', () => {
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const test = 'TeSt'
    it('b64', () => {
        const b = b64encode(enc.encode(test))
        const d = b64decode(b)
        expect(dec.decode(d)).eq(test)
    })

    it('url safe', () => {
        const b = urlSafeB64Encode(enc.encode(test))
        const d = urlSafeB64Decode(b)
        expect(dec.decode(d)).eq(test)
    })
})
