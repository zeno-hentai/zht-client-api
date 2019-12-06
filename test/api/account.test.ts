import {it} from 'mocha'
import {expect} from 'chai'
import { getClient } from './utils/client';

const client = getClient()
const username = `test_user_${new Date().getTime()}`
const password = `test_password_${new Date().getTime()}`
const masterKey = 'admin-secret'

describe('account life cycle', () => {
    it("unregistered", async () => {
        expect((await client.info()).authorized).to.be.false
    })
    it('register', async() => {
        const res = await client.register({
            username, password, masterKey
        })
        JSON.parse(res.privateKey)
    })
    it('check uesr info', async () => {
        let userInfo = await client.infoDecrypted(password)
        expect(userInfo.authorized).to.be.true
        if(userInfo.authorized){
            expect(userInfo.username).eq(username)
            JSON.parse(userInfo.privateKey)
        }
    })
    it('logout', async () => {
        await client.logout()
        expect((await client.info()).authorized).to.be.false
    })
    it('login  again', async () => {
        const res = await client.login({username, password})
        expect((await client.info()).authorized).to.be.true
        JSON.parse(res.privateKey)
    })
    it('delete account', async () => {
        await client.deleteUser()
        expect((await client.info()).authorized).to.be.false
    })
})