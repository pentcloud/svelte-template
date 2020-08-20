import API from './api'

export const create = async (data, query, config)=>{
    return await API.post(`api/user?${query}`, data, config)
}

export const destroy = async (resource = "undefined", query, config)=>{
    return await API.delete(`api/user/${resource}?${query}`, config)
}

export const update = async (resource = "undefined", data, query, config)=>{
    return await API.put(`api/user/${resource}?${query}`, data, config)
}

export const findMany = async (query = "", config)=>{
    return await API.get(`api/user?${query}`, data, config)
}

export const findOne = async (resource = "undefined", query, config)=>{
    return await API.get(`api/user/${resource}?${query}`, config)
}
