import {it} from 'mocha'
import {expect} from 'chai'
import axios from 'axios'

it("detect server on localhost:8080", async () => {
    const res = await axios.get<string>("http://localhost:8080")
    expect("SUCCESS").eq(res.data)
})