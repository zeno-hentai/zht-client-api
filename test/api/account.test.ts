import {it} from 'mocha'
import chai, {expect} from 'chai'
import axios from 'axios'
import ZHTClientAPI from '../../lib/ZHTClientAPI';
import { rsaGenKey } from '../../lib';
import { isNull } from 'util';

const client = new ZHTClientAPI({
    baseURL: "http://localhost:8080",
    testHandleCookies: true
})
const username = "233"
const password = "666"
const masterKey = 'admin-secret'

it("register -> delete", async () => {
    expect((await client.info()).authorized).to.be.false
    await client.register({
        username, password, masterKey
    })
    let userInfo = await client.info()
    expect(userInfo.authorized).to.be.true
    if(userInfo.authorized){
        expect(userInfo.username).eq(username)
    }
    await client.logout()
    expect((await client.info()).authorized).to.be.false
    await client.login({username, password})
    expect((await client.info()).authorized).to.be.true
    await client.delete()
    expect((await client.info()).authorized).to.be.false
})