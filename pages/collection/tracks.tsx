import { ReactElement } from "react";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";

import PlaylistLayout from "layouts/playlist";
import { ISpotifyContext, ITrack } from "types/spotify";
import {
  getAuth,
  getTranslations,
  isCorruptedTrack,
  Page,
  serverRedirect,
} from "utils";
import { checkTracksInLibrary, getMyLikedSongs } from "utils/spotifyCalls";

interface PlaylistProps {
  pageDetails: ISpotifyContext["pageDetails"];
  playListTracks: ITrack[];
  tracksInLibrary: boolean[] | null;
  user: SpotifyApi.UserObjectPrivate | null;
  translations: Record<string, string>;
}

const Playlist = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
): ReactElement | null => {
  if (!props.pageDetails) return null;
  return (
    <PlaylistLayout
      isLibrary={true}
      pageDetails={props.pageDetails}
      playListTracks={props.playListTracks}
      tracksInLibrary={props.tracksInLibrary}
      user={props.user}
      translations={props.translations}
    />
  );
};

export default Playlist;

export const getServerSideProps = (async (context) => {
  const country = (context.query.country ?? "US") as string;
  const translations = getTranslations(country, Page.CollectionTracks);
  const cookies = context.req?.headers?.cookie;
  if (!cookies) {
    serverRedirect(context.res, "/");
    return { props: {} };
  }
  const { user } = (await getAuth(context)) ?? {};

  const playListTracks = await getMyLikedSongs(50, 0, context);
  const trackIds = playListTracks?.items
    ?.filter(({ track }) => {
      if (track?.id) {
        return true;
      }
      return false;
    })
    .map(({ track }) => track?.id) as string[] | undefined;
  const tracksInLibrary = await checkTracksInLibrary(trackIds ?? [], context);

  if (!playListTracks) {
    return { props: {} };
  }

  const pageDetails: ISpotifyContext["pageDetails"] = {
    id: "tracks",
    images: [
      {
        url: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png",
      },
    ],
    name: translations.likedSongs,
    owner: {
      id: user?.id,
      display_name: user?.display_name,
    },
    tracks: {
      total: playListTracks.total,
    },
    type: "collection",
    uri: user?.id ? `spotify:user:${user.id}:collection` : "",
  };
  return {
    props: {
      pageDetails,
      tracksInLibrary,
      playListTracks: playListTracks.items.map(
        ({ track, added_at }, i: number) => {
          return {
            ...track,
            corruptedTrack: isCorruptedTrack(track),
            position: i,
            added_at,
          };
        }
      ),
      user: user ?? null,
      translations,
    },
  };
}) satisfies GetServerSideProps<Partial<PlaylistProps>>;
