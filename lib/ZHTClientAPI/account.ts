import {ZHTClientAPI} from './base';
import { ZHTUserInfo, ZHTUserUnauthorized } from '../data';
import { sha256Hash } from '../utils/crypto/sha256';
import { rsaGenKey } from '../utils/crypto/rsa';
import { aesEncrypt, aesDecrypt } from '../utils/crypto/aes';
import { ZHTDecryptedUserInfo } from '../data/user';

declare module './base' {
    interface ZHTClientAPI {
        register(request: ZHTRegisterRequest): Promise<ZHTUserInfo>
        login(request: ZHTLoginRequest): Promise<ZHTUserInfo>
        info(): Promise<ZHTUserInfo | ZHTUserUnauthorized>
        infoDecrypted(password: string): Promise<ZHTDecryptedUserInfo | ZHTUserUnauthorized>
        logout(): Promise<void>
        deleteUser(): Promise<void>
    }
}

export interface ZHTRegisterRequest {
    username: string
    password: string
    masterKey: string
}

export interface ZHTLoginRequest {
    username: string
    password: string
}

interface EncryptedZHTRegisterRequest {
    username: string
    password: string
    publicKey: string
    encryptedPrivateKey: string
    masterKey: string
}

interface EncryptedZHTLoginRequest {
    username: string
    password: string
}

ZHTClientAPI.prototype.register = async function(request: ZHTRegisterRequest): Promise<ZHTUserInfo>{
    const {username, password, masterKey} = request
    const encryptedPassword = await sha256Hash(password)
    const {publicKey, privateKey} = await rsaGenKey()
    const encryptedPrivateKey = await aesEncrypt(privateKey, encryptedPassword)
    return await this.http.post<ZHTUserInfo, EncryptedZHTRegisterRequest>("/api/auth/register", {
        username,
        password: encryptedPassword,
        publicKey,
        encryptedPrivateKey,
        masterKey
    })
}

ZHTClientAPI.prototype.login = async function({username, password}: ZHTLoginRequest): Promise<ZHTUserInfo>{
    const encryptedPassword = await sha256Hash(password)
    return await this.http.post<ZHTUserInfo, EncryptedZHTLoginRequest>("/api/auth/login", {
        username,
        password: encryptedPassword
    })
}

ZHTClientAPI.prototype.info = async function(): Promise<ZHTUserInfo | ZHTUserUnauthorized> {
    return await this.http.get<ZHTUserInfo | ZHTUserUnauthorized>("/api/user/info")
}

ZHTClientAPI.prototype.infoDecrypted = async function (password: string): Promise<ZHTDecryptedUserInfo | ZHTUserUnauthorized> {
    const encryptedPassword = await sha256Hash(password)
    const info = await this.info()
    if(info.authorized){
        const {encryptedPrivateKey, ...rest} = info
        const privateKey = await aesDecrypt(encryptedPrivateKey, encryptedPassword)
        return {privateKey, ...rest}
    }else{
        return info
    }
}

ZHTClientAPI.prototype.logout = async function(): Promise<void> {
    return await this.http.delete("/api/auth/logout")
}

ZHTClientAPI.prototype.deleteUser = async function(): Promise<void> {
    return await this.http.delete("/api/auth/delete")
}

export default {} // work around