import type { ServerApiContext } from "types/serverContext";
import { handleJsonResponse } from "utils";
import { callSpotifyApi } from "utils/spotifyCalls";

export async function checkEpisodesInLibrary(
  ids: string[],
  context?: ServerApiContext
): Promise<boolean[] | null> {
  if (ids?.length === 0) return null;
  const stringIds = ids?.join(",");

  const res = await callSpotifyApi({
    endpoint: `/me/episodes/contains?ids=${stringIds}`,
    method: "GET",
    context,
  });

  return handleJsonResponse<boolean[]>(res);
}
