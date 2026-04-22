import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  const tokenType = localStorage.getItem("token_type")

  if (token && tokenType) {
    config.headers.Authorization = `${tokenType} ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail
    const url = String(error.config?.url || "")

    const erroDeAutenticacao =
      status === 401 &&
      typeof detail === "string" &&
      !detail.includes("permissão necessária")

    const rotaPublica = url.includes("/auth/login") || url.includes("/password/")

    if (erroDeAutenticacao && !rotaPublica) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("token_type")
      localStorage.removeItem("usuario")

      if (window.location.pathname !== "/logar") {
        window.location.assign("/logar")
      }
    }

    return Promise.reject(error)
  }
)

export default api