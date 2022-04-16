import { AudioPlayer } from "hooks/useSpotifyPlayer";
import { Dispatch, SetStateAction } from "react";

export type AuthorizationResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string | undefined;
  expiresIn: number;
};

export type SpotifyUserResponse = {
  name: string | undefined;
  image: string | undefined;
  href: string;
  id: string;
  product: string | undefined;
  followers: SpotifyApi.FollowersObject | undefined;
  country: string;
};
// Playlists
export type PlaylistItem = SpotifyApi.PlaylistObjectSimplified;

export type PlaylistItems = PlaylistItem[];

export type UserPlaylistsResponse = {
  items: PlaylistItems;
  total: number;
};

interface Artist extends Spotify.Artist {
  id?: string | null;
  type?: "artist" | undefined;
  href?: string | undefined;
  external_urls?: SpotifyApi.ExternalUrlObject | undefined;
}

interface Album extends Spotify.Album {
  album_type?: "album" | "single" | "compilation";
  artists?: Artist[];
  id?: string;
  release_date?: string;
  external_urls?: SpotifyApi.ExternalUrlObject;
  available_markets?: string[];
  type?: "track" | "album" | "episode" | "ad";
}

//Tracks
export type normalTrackTypes = {
  name?: string;
  corruptedTrack?: boolean;
  position?: number;
  images?: Array<{ url: string }>;
  uri?: Spotify.Track["uri"];
  href?: string;
  artists?: Artist[];
  id?: string | null;
  audio?: string | null;
  explicit?: boolean;
  duration?: number;
  album: Album;
  added_at?: string;
  type: "track" | "episode" | "ad";
  media_type?: "audio" | "video";
  is_playable?: boolean | undefined;
  is_local?: boolean;
};
export type trackItem = normalTrackTypes;

export type AllTracksFromAPlayList = trackItem[];

export type AllTracksFromAPlaylistResponse = {
  tracks: AllTracksFromAPlayList;
};

export type RemoveTracksResponse = string | undefined;

type Identity<T> = { [P in keyof T]: T[P] };
type Replace<T, K extends keyof T, TReplace> = Identity<
  Pick<T, Exclude<keyof T, K>> & {
    [P in K]: TReplace;
  }
>;

export interface ISpotifyContext {
  playlists: PlaylistItems;
  setPlaylists: Dispatch<SetStateAction<PlaylistItems>>;
  totalPlaylists: number;
  setTotalPlaylists: Dispatch<SetStateAction<number>>;
  deviceId: string | undefined;
  setDeviceId: Dispatch<SetStateAction<string | undefined>>;
  allTracks: AllTracksFromAPlayList;
  setAllTracks: Dispatch<SetStateAction<AllTracksFromAPlayList>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  isPlaying: boolean;
  setIsShowingSideBarImg: Dispatch<SetStateAction<boolean>>;
  isShowingSideBarImg: boolean;
  setCurrentlyPlaying: Dispatch<SetStateAction<trackItem | undefined>>;
  currrentlyPlaying: trackItem | undefined;
  currentlyPlayingPosition: number | undefined;
  currentlyPlayingDuration: number | undefined;
  setCurrentlyPlayingPosition: Dispatch<SetStateAction<number | undefined>>;
  setCurrentlyPlayingDuration: Dispatch<SetStateAction<number | undefined>>;
  player: Spotify.Player | AudioPlayer | undefined;
  setPlayer: Dispatch<SetStateAction<Spotify.Player | AudioPlayer | undefined>>;
  playlistDetails: Replace<
    SpotifyApi.SinglePlaylistResponse,
    "type",
    "playlist" | "artist" | "collection"
  > | null;
  setPlaylistPlayingId: Dispatch<SetStateAction<string | undefined>>;
  playlistPlayingId: string | undefined;
  setPlaylistDetails: Dispatch<
    SetStateAction<Replace<
      SpotifyApi.SinglePlaylistResponse,
      "type",
      "playlist" | "artist" | "collection"
    > | null>
  >;
  playedSource: string | undefined;
  setPlayedSource: Dispatch<SetStateAction<string | undefined>>;
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  lastVolume: number;
  setLastVolume: Dispatch<SetStateAction<number>>;
}
