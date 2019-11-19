import {describe, it} from 'mocha'
import {expect} from 'chai'
import {aesEncrypt, aesDecrypt} from '../lib/aes'

it('aes', async () => {
    const plainText = "23333"
    const key = "66666"
    const encrypted = await aesEncrypt(plainText, key)
    const decrypted = await aesDecrypt(encrypted, key)
    expect(plainText).eq(decrypted)
})