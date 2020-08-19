import client from '@pentcloud/client'

const fuckTheWorld = async ()=>{
    return await client.instance.get('http://localhost:3000')
}
const fuckTheWorld2 = async ()=>{
    return await client.instance.get('http://localhost:3000')
}
const fuckTheWorld3 = async ()=>{
    return await client.instance.get('http://localhost:3000')
}

export default {
    fuckTheWorld,
    fuckTheWorld2,
    fuckTheWorld3
}
