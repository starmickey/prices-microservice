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
    .then((res: any) => res.data.enabled) // If the call succeds, the article exists
    .catch((error) => {
      if (error.response) {
        const { status, statusText, data } = error.response;

        switch (status) {
          case 400:
            throw new APIError("Invalid article id", 400);

          case 404:
            return false;

          case 500:
            if (data?.error === 'mongo: no documents in result') {
              return false;
            }
          default:
            throw new APIError(`${statusText} ${data?.error || data?.message || "Couldn't retrieve the article from catalog"}`, status);
        }
      }

      throw new APIError(error.message || "Couldn't retrieve the article from catalog", 500);
    });
}
