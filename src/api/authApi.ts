import axios from "axios";
import { getConfig } from "../config";

/**
 * Get user from authentication microservice
 * 
 * @param token - session token
 * @returns user
 */

export async function getCurrentUser(token: string) {
  const { authUrl } = getConfig();
  
  return axios.get(`${authUrl}/users/current`, {
    headers: {
      Authorization: `bearer ${token}`
    }
  })
}