import { ReactElement } from "react";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";

import PlaylistLayout from "layouts/playlist";
import { IPageDetails, ITrack } from "types/spotify";
import {
  fullFilledValue,
  getAuth,
  getSiteUrl,
  getTranslations,
  Page,
  serverRedirect,
  TOP_TRACKS_LONG_TERM_COLOR,
} from "utils";
import { checkTracksInLibrary, getMyTop } from "utils/spotifyCalls";
import { TopType } from "utils/spotifyCalls/getMyTop";

export interface PlaylistProps {
  pageDetails: IPageDetails | null;
  tracksInLibrary: boolean[] | null;
  playListTracks: ITrack[] | null;
  user: SpotifyApi.UserObjectPrivate | null;
  translations: Record<string, string>;
}

const Playlist = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
): ReactElement | null => {
  if (!props.pageDetails) return null;

  return (
    <PlaylistLayout
      pageDetails={props.pageDetails}
      isLibrary={false}
      playListTracks={props.playListTracks}
      tracksInLibrary={props.tracksInLibrary}
      user={props.user}
      translations={props.translations}
      isGeneratedPlaylist={true}
    />
  );
};

export default Playlist;

export const getServerSideProps = (async (context) => {
  const country = (context.query.country ?? "US") as string;
  const translations = getTranslations(country, Page.TopTracks);
  const cookies = context.req?.headers?.cookie;
  if (!cookies) {
    serverRedirect(context.res, "/");
    return { props: {} };
  }
  const { user } = (await getAuth(context)) ?? {};

  const usersTopTracksProm = getMyTop(TopType.TRACKS, 50, "long_term", context);

  const [usersTopTracksSettledResult] = await Promise.allSettled([
    usersTopTracksProm,
  ]);
  const usersTopTracks = fullFilledValue(usersTopTracksSettledResult);
  if (!usersTopTracks) {
    serverRedirect(context.res, "/");
    return { props: {} };
  }
  const allTracks = usersTopTracks.items;
  const playListTracks =
    usersTopTracks && allTracks?.length > 0
      ? allTracks?.map((track, i) => {
          return {
            ...track,
            added_at: new Date().toISOString(),
            position: i,
          };
        })
      : null;
  const usersTopTracksIds = playListTracks?.map((item) => item.id) ?? [];

  const tracksInLibrary = await checkTracksInLibrary(
    usersTopTracksIds,
    context
  );
  const pageTitle = `${translations.title} - ${translations.longTerm}`;

  const pageDetails: IPageDetails = {
    name: pageTitle,
    images: [
      {
        url: `${getSiteUrl()}/api/top-tracks-cover?title=${
          translations.longTerm
        }&color=${TOP_TRACKS_LONG_TERM_COLOR}&imageUrl=${
          user?.images?.[0]?.url ?? ""
        }`,
      },
    ],
    owner: {
      display_name: "Spotify",
      id: "spotify",
    },
    type: "top",
    tracks: {
      total: playListTracks?.length ?? 0,
    },
  };

  return {
    props: {
      pageDetails,
      tracksInLibrary,
      playListTracks,
      user: user ?? null,
      translations,
    },
  };
}) satisfies GetServerSideProps<Partial<PlaylistProps>>;
