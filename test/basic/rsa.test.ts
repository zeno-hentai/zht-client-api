import {it} from 'mocha'
import {expect} from 'chai'
import {rsaEncrypt, rsaDecrypt, rsaGenKey, rsaEncryptWrapped, rsaDecryptWrapped} from '../../lib/utils/crypto/rsa'


describe('rsa', () => {
    it('rsa', async () => {
        const plainText = "23333".repeat(1000)
        const {privateKey, publicKey} = await rsaGenKey()
        const enc = new TextEncoder()
        const dec = new TextDecoder()
        const encrypted = await rsaEncrypt(enc.encode(plainText), publicKey)
        const decrypted = await rsaDecrypt(encrypted, privateKey)
        expect(plainText).eq(dec.decode(decrypted))
    })

    it('wrapped', async () => {
        const plainText = "23333".repeat(1000)
        const {privateKey, publicKey} = await rsaGenKey()
        const encrypted = await rsaEncryptWrapped(plainText, publicKey)
        const decrypted = await rsaDecryptWrapped(encrypted, privateKey)
        expect(plainText).eq(decrypted)
    })
})