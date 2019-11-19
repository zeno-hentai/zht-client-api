import {it} from 'mocha'
import {expect} from 'chai'
import {rsaEncrypt, rsaDecrypt, rsaGenKey} from '../lib/rsa'


it('rsa', async () => {
    const plainText = "23333"
    const {privateKey, publicKey} = await rsaGenKey()
    const encrypted = await rsaEncrypt(plainText, publicKey)
    console.log(encrypted)
    const decrypted = await rsaDecrypt(encrypted, privateKey)
    expect(plainText).eq(decrypted)
})