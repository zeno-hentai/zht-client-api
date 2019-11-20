import {it} from 'mocha'
import {expect} from 'chai'
import axios from 'axios'
import { getClient } from './utils/client';

const client = getClient()

it("detect server on localhost:8080", async () => {
    const res = await axios.get<string>("http://localhost:8080")
    expect("SUCCESS").eq(res.data)
})