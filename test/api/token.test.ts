import { getClient } from './utils/client';
import {expect} from 'chai'
import { APITokenCreateResponse } from '../../lib/data/token';
const client = getClient()

describe('api token testing', () => {
    const API_TOKEN_TITLE = "test token"
    let apiToken: APITokenCreateResponse | null

    before(async() => {
        await client.register({username: `test_${new Date().getTime()}`, password: 'test', masterKey: 'admin-secret'})
    })
    
    after(async() => {
        await client.deleteUser()
    })
    
    it('create token', async () => {
        apiToken = await client.createToken(API_TOKEN_TITLE)
        expect(apiToken.title).eq(API_TOKEN_TITLE)
    })
    
    it('query token', async () => {
        const tokens = await client.queryTokens()
        expect(tokens.length).eq(1)
        expect(apiToken).not.null
        const token = tokens[0]
        if(token && apiToken) {
            expect(token.id).eq(apiToken.id)
            expect(token.title).eq(apiToken.title)
        }
    })

    it('delete token', async () => {
        expect(apiToken).not.null
        if(apiToken){
            await client.deleteToken(apiToken.id)
        }
        const tokens = await client.queryTokens()
        expect(tokens.length).eq(0)
    })
})