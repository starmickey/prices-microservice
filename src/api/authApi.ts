import axios from "axios";
import { getConfig } from "../config";

export async function getCurrentUser(token: string) {
  const { authUrl } = getConfig();
  
  return axios.get(`${authUrl}/users/current`, {
    headers: {
      Authorization: `bearer ${token}`
    }
  })
}