import { getConfig } from "../config";
import axios from "axios";
import { APIError } from "../utils/exceptions";

export async function getArticleExists(articleId: string, token: string): Promise<boolean> {
  const { catalogUrl } = getConfig();

  return axios
    .get(`${catalogUrl}/articles/${articleId}`, {
      headers: {
        Authorization: `bearer ${token}`, // Ensure "Bearer" is capitalized
      },
    })
    .then((_) => true) // If the call succeds, the article exists
    .catch((error) => {
      console.error(error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 404) {
          return false; // Article not found
        }

        if (status === 400) {
          throw new APIError("Invalid article id", 400);
        }

        throw new APIError(data?.message || "Couldn't retrieve the article", status);
      }

      throw new APIError(error.message || "Couldn't retrieve the article", 500);
    });
}
