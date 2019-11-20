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
        await client.register({
            username, password, masterKey
        })
    })
    it('check uesr info', async () => {
        let userInfo = await client.info()
        expect(userInfo.authorized).to.be.true
        if(userInfo.authorized){
            expect(userInfo.username).eq(username)
        }
    })
    it('logout', async () => {
        await client.logout()
        expect((await client.info()).authorized).to.be.false
    })
    it('login  again', async () => {
        await client.login({username, password})
        expect((await client.info()).authorized).to.be.true
    })
    it('delete account', async () => {
        await client.deleteUser()
        expect((await client.info()).authorized).to.be.false
    })
})