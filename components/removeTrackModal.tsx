import { createPortal } from "react-dom";
import {
  Dispatch,
  ReactPortal,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import useSpotify from "hooks/useSpotify";
import useAuth from "hooks/useAuth";
import { AllTracksFromAPlayList, normalTrackTypes } from "types/spotify";
import { findDuplicateSongs } from "utils/findDuplicateSongs";
import ModalCardTrack from "./forPlaylistsPage/CardTrack";
import { takeCookie } from "utils/cookies";
import { ACCESS_TOKEN_COOKIE } from "utils/constants";
import { List } from "react-virtualized";
import { LoadingSpinner } from "./LoadingSpinner";
import useToast from "hooks/useToast";

interface RemoveTracksModalProps {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  isLibrary: boolean;
}

export default function RemoveTracksModal({
  openModal,
  setOpenModal,
  isLibrary,
}: RemoveTracksModalProps): ReactPortal | null {
  const [targetNode, setTargetNode] = useState<Element>();
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const secondButtonRef = useRef<HTMLButtonElement | null>(null);
  const { removeTracks, playlistDetails, setAllTracks } = useSpotify();
  const { accessToken } = useAuth();
  const [duplicatesSongs, setduplicatesSongs] = useState<normalTrackTypes[]>(
    []
  );
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function getPlaylist(id: string | undefined) {
      if (!playlistDetails) {
        return;
      }
      let tracks: AllTracksFromAPlayList = [];
      const limit = isLibrary ? 50 : 100;
      const max = Math.ceil(playlistDetails.tracks.total / limit);

      setIsLoadingComplete(false);

      for (let i = 0; i < max; i++) {
        const res = await fetch(
          `https://api.spotify.com/v1/${
            !isLibrary ? `playlists/${id}` : "me"
          }/tracks?limit=${limit}&offset=${limit * i}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data: SpotifyApi.PlaylistTrackResponse | undefined =
          await res.json();
        const newTracks: AllTracksFromAPlayList | undefined = data?.items?.map(
          ({ track, added_at, is_local }, index) => {
            return {
              name: track?.name,
              images: track?.album.images,
              uri: track?.uri,
              href: track?.external_urls.spotify,
              artists: track.artists,
              id: track?.id,
              explicit: track?.explicit,
              duration: track?.duration_ms,
              audio: track?.preview_url,
              corruptedTrack: !track?.uri,
              position: limit * i + index,
              album: track.album,
              added_at,
              type: track.type,
              media_type: "audio",
              is_playable: track.is_playable,
              is_local,
            };
          }
        );
        if (newTracks) {
          tracks = [...tracks, ...newTracks];
        }
      }

      setAllTracks(tracks);
      const duplicatesSongs = findDuplicateSongs(tracks);
      const duplicateTracks = duplicatesSongs.map(({ index }) => {
        return tracks[index];
      });
      setduplicatesSongs(duplicateTracks);
      setIsLoadingComplete(true);
      return tracks;
    }
    getPlaylist(playlistDetails?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressKey = useCallback(
    (event) => {
      const firstElement = firstButtonRef.current;
      const lastElement = secondButtonRef.current;
      if (event.key === "Escape") {
        setOpenModal(false);
      }
      if (
        !event.shiftKey &&
        document.activeElement !== firstElement &&
        event.key !== "Enter"
      ) {
        firstElement?.focus();
        return event.preventDefault();
      }
      if (
        event.shiftKey &&
        event.key === "Tab" &&
        document.activeElement !== lastElement &&
        event.key !== "Enter"
      ) {
        lastElement?.focus();
        event.preventDefault();
      }
      return;
    },
    [setOpenModal]
  );

  useEffect(() => {
    setTargetNode(document.querySelector("#tracksModal") as Element);
    document.addEventListener("keydown", onPressKey, false);

    return () => {
      document.removeEventListener("keydown", onPressKey, false);
    };
  }, [onPressKey]);

  useLayoutEffect(() => {
    const elementToBlur = document.querySelector<HTMLElement>(".container");
    if (elementToBlur) {
      elementToBlur.style.filter = "blur(2.5px)";
    }

    return () => {
      if (elementToBlur) {
        elementToBlur.style.filter = "blur(0px)";
      }
    };
  }, [targetNode]);

  if (targetNode === undefined) {
    return null;
  }

  return createPortal(
    <div className="popupConfirm">
      <div
        className="overlay"
        onClick={() => setOpenModal(false)}
        aria-checked={openModal}
        onKeyDown={(e) => e.key === "Escape" && setOpenModal(false)}
        role="switch"
        tabIndex={0}
      ></div>
      <div
        className="popupContainer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="globalModalTitle"
        aria-describedby="globalModaldesc"
      >
        {!isLoadingComplete ? (
          <div className="loading-message">
            <LoadingSpinner />
            <h3 id="globalModalTitle">Analizando playlist</h3>
          </div>
        ) : (
          <h3 id="globalModalTitle">
            {duplicatesSongs.length === 0
              ? "No hay canciones duplicadas"
              : duplicatesSongs.length === 1
              ? "Hay una canción duplicada"
              : `Hay ${duplicatesSongs.length} canciones duplicadas`}
          </h3>
        )}
        <div className="tracks">
          {duplicatesSongs.length > 0 ? (
            <List
              height={330}
              width={800}
              overscanRowCount={2}
              rowCount={duplicatesSongs.length}
              rowHeight={65}
              rowRenderer={({ index, style, key }) => {
                if (duplicatesSongs[index]?.corruptedTrack) {
                  return null;
                }

                return (
                  <div style={{ ...style, width: "100%" }} key={key}>
                    <ModalCardTrack
                      accessToken={accessToken}
                      isTrackInLibrary={false}
                      track={duplicatesSongs[index]}
                      playlistUri={playlistDetails?.uri ?? ""}
                      type="album"
                    />
                  </div>
                );
              }}
            />
          ) : null}
        </div>
        <div className="popupContainer_buttons">
          <button
            ref={firstButtonRef}
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              setOpenModal(false);
            }}
          >
            Cancelar
          </button>
          <button
            ref={secondButtonRef}
            onClick={async (e) => {
              e.preventDefault();
              if (!isLibrary) {
                const indexes = duplicatesSongs.map(
                  ({ position }) => position as number
                );
                const snapshot = await removeTracks(
                  playlistDetails?.id,
                  indexes,
                  playlistDetails?.snapshot_id
                );
                if (snapshot) {
                  setAllTracks((tracks) => {
                    return tracks.filter((_, i) => {
                      if (indexes.includes(i)) {
                        return false;
                      }
                      return true;
                    });
                  });
                  setduplicatesSongs([]);
                  addToast({
                    variant: "success",
                    message: "Tracks removed from playlist",
                  });
                } else {
                  addToast({
                    variant: "error",
                    message: "Error removing tracks from playlist",
                  });
                }
              }

              if (isLibrary) {
                const arrays: (string | null)[][] = [];
                const ids = duplicatesSongs.map(({ id }) => id as string);
                for (let i = 0; i < duplicatesSongs.length; i += 50) {
                  arrays.push(ids.slice(i, i + 50));
                }
                const promises = arrays.map((ids) =>
                  fetch("https://api.spotify.com/v1/me/tracks", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${
                        accessToken
                          ? accessToken
                          : takeCookie(ACCESS_TOKEN_COOKIE)
                      }`,
                    },
                    body: JSON.stringify({ ids }),
                  })
                );
                Promise.all(promises)
                  .then(() => {
                    setAllTracks((tracks) => {
                      return tracks.filter((track) => {
                        if (ids.includes(track.id ?? "")) {
                          return false;
                        }
                        return true;
                      });
                    });
                    setduplicatesSongs([]);
                    addToast({
                      variant: "success",
                      message: "Tracks removed from library",
                    });
                  })
                  .catch(() => {
                    addToast({
                      variant: "error",
                      message: "Error removing tracks from library",
                    });
                  });
              }
            }}
          >
            Limpiar
          </button>
        </div>
      </div>
      <style jsx>{`
        .tracks {
          overflow-y: hidden;
          overflow-x: hidden;
          max-height: calc(100vh - 300px);
        }
        button:nth-of-type(2) {
          background: rgb(204, 0, 0);
          border-color: rgb(204, 0, 0);
          color: #fff;
          opacity: 0.7;
        }
        button:nth-of-type(1):hover,
        button:nth-of-type(1):focus {
          opacity: 1;
        }
      `}</style>
      <style jsx>{`
        h3 {
          text-align: center;
          margin: 0 0 10px 0;
        }
        .overlay {
          position: fixed;
          top: 0px;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.2);
        }
        .popupConfirm {
          position: fixed;
          z-index: 9999999999;
          top: 0px;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .popupContainer {
          display: block;
          position: fixed;
          width: calc(100% - 20px);
          max-width: 830px;
          padding: 10px 10px 55px 10px;
          border: 1px solid #282828;
          background: linear-gradient(
            -45deg,
            #212329,
            #202327,
            #242527,
            #464651
          );
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          border-radius: 4px;
          min-height: 300px;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .loading-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        p {
          margin: 0;
          font-size: 14px;
        }
        .popupContainer_buttons {
          display: flex;
          margin-top: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
          position: absolute;
          bottom: 20px;
          right: 20px;
        }
        button {
          padding: 6px 8px;
          font-weight: 400;
          background: transparent;
          border-radius: 5px;
          border: 1px solid #cccccc4d;
          cursor: pointer;
          color: inherit;
        }
        button:nth-of-type(1) {
          margin-right: 10px;
        }
        button:focus,
        button:hover {
          border: 1px solid #cccccca1;
        }
      `}</style>
    </div>,
    targetNode
  );
}
