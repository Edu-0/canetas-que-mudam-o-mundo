import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  const tokenType = localStorage.getItem("token_type")

  if (token) {
    config.headers.Authorization = `${tokenType || "Bearer"} ${token}`
  }

  return config
})

export default api