import {describe, it} from 'mocha'
import {expect} from 'chai'
import {aesEncrypt, aesDecrypt, hashToAesKey, aesEncryptWrapped, aesDecryptWrapped, aesEncryptWrappedUrlSafe, aesDecryptWrappedUrlSafe} from '../../lib/utils/crypto/aes'

describe('aes', () => {
    it('key', async () => {
        const key = await hashToAesKey('233')
        expect(key.byteLength).eq(32)
    })

    it('encrypt', async () => {
        const enc = new TextEncoder()
        const dec = new TextDecoder()
        const data = enc.encode("23333")
        const key = "66666"
        const encrypted = await aesEncrypt(data, key)
        const decrypted = await aesDecrypt(encrypted, key)
        expect(dec.decode(data)).eq(dec.decode(decrypted))
    })

    it('wrapped', async () => {
        const data = '2333333'
        const key = "66666"
        const encrypted = await aesEncryptWrapped(data, key)
        const decrypted = await aesDecryptWrapped(encrypted, key)
        expect(decrypted).eq(data)
    })

    it('wrapped url safe', async () => {
        const data = '2333333'
        const key = "66666"
        const encrypted = await aesEncryptWrappedUrlSafe(data, key)
        const decrypted = await aesDecryptWrappedUrlSafe(encrypted, key)
        expect(decrypted).eq(data)
    })
})