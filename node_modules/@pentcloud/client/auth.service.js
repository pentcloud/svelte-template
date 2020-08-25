import API from './api'

export const signIn = async (data, config)=>{
    return await API.post(`auth/signin`, data, config)
}

export const forgotPassword = async (data, config)=>{
    return await API.post(`auth/reset`, data, config)
}

export const confirmPassword = async (data, config)=>{
    return await API.put(`auth/reset`, data, config)
}