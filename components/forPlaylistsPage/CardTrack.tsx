import { Pause, Play, Playing } from "components/icons";
import { Heart, HeartShape } from "components/icons/Heart";
import ThreeDots from "components/icons/ThreeDots";
import useSpotify from "hooks/useSpotify";
import { getTimeAgo } from "utils/getTimeAgo";
import { MutableRefObject, useRef, useState } from "react";
import { normalTrackTypes } from "types/spotify";
import { formatTime } from "utils/formatTime";
import Link from "next/link";
import useAuth from "hooks/useAuth";
import { playCurrentTrack } from "utils/playCurrentTrack";

interface ModalCardTrackProps {
  track: normalTrackTypes;
  accessToken: string | undefined;
  playlistUri: string;
  isTrackInLibrary: boolean;
}

const ExplicitSign: React.FC = () => {
  return (
    <div>
      <small>E</small>
      <style jsx>{`
        small {
          font-size: 10px;
          font-weight: bold;
          color: #463f3f;
          font-family: "Lato", sans-serif;
        }
        div {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          background-color: #d2d2d2;
          width: 17px;
          height: 17px;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

const ModalCardTrack: React.FC<ModalCardTrackProps> = ({
  accessToken,
  track,
  playlistUri,
  isTrackInLibrary,
}) => {
  const {
    deviceId,
    currrentlyPlaying,
    player,
    isPlaying,
    setIsPlaying,
    allTracks,
    setCurrentlyPlaying,
    playlistDetails,
    setPlaylistPlayingId,
  } = useSpotify();
  const [mouseEnter, setMouseEnter] = useState(false);
  const [isHoveringHeart, setIsHoveringHeart] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const trackRef = useRef<HTMLDivElement>();
  const { user } = useAuth();
  const isPremium = user?.product === "premium";

  const isPlayable =
    (!isPremium && track.audio) ||
    (isPremium && !(track.is_playable === false));

  const isTheSameAsCurrentlyPlaying =
    currrentlyPlaying?.name === track.name &&
    currrentlyPlaying?.artists === track.artists &&
    currrentlyPlaying?.album.name === track.album.name;

  function playThisTrack() {
    playCurrentTrack(track, {
      allTracks,
      player,
      user,
      accessToken,
      deviceId,
      playlistUri,
      playlistId: playlistDetails?.id,
      setCurrentlyPlaying,
      setPlaylistPlayingId,
    });
  }

  return (
    <div
      className="trackItem"
      onDoubleClick={() => {
        playThisTrack();
      }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => {
        setMouseEnter(true);
      }}
      onFocus={() => {
        setIsFocusing(true);
      }}
      onBlur={() => {
        setIsFocusing(false);
      }}
      onMouseLeave={() => setMouseEnter(false)}
      ref={trackRef as MutableRefObject<HTMLDivElement>}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
        }
        if (e.key === " ") {
          e.preventDefault();
          player?.togglePlay();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (isPlaying && isTheSameAsCurrentlyPlaying) {
            player?.pause();
            setIsPlaying(false);
            setPlaylistPlayingId(playlistDetails?.id);
          } else {
            playThisTrack();
          }
        }
      }}
    >
      <button
        onClick={() => {
          if (isPlaying && isTheSameAsCurrentlyPlaying) {
            player?.pause();
            setIsPlaying(false);
          } else {
            playThisTrack();
          }
        }}
      >
        {mouseEnter && isTheSameAsCurrentlyPlaying && isPlaying ? (
          <Pause fill="#fff" />
        ) : isTheSameAsCurrentlyPlaying && isPlaying ? (
          <Playing />
        ) : (mouseEnter || isFocusing) && isPlayable ? (
          <Play fill="#fff" />
        ) : (
          <span className="position">{`${(track.position ?? 0) + 1}`}</span>
        )}
      </button>
      <section>
        {track.images ? (
          <img
            loading="lazy"
            src={track.images[2]?.url ?? track.images[1]?.url}
            alt=""
            width="48"
            height="48"
          />
        ) : null}
        <div className="trackArtistsContainer">
          <p className="trackName">{`${track.name}`}</p>
          {track.explicit && <ExplicitSign />}
          <span className="trackArtists">
            {track.artists?.map((artist) => {
              return (
                <Link key={artist.id} href={`/artist/${artist.id}`}>
                  <a>{artist.name}</a>
                </Link>
              );
            })}
          </span>
        </div>
      </section>
      <section>
        <p className="trackArtists">
          <Link href={`/album/${track.album.id}`}>
            <a>{track.album.name}</a>
          </Link>
        </p>
      </section>
      <section>
        <p className="trackArtists">
          {getTimeAgo(
            track.added_at ? +new Date(track.added_at) : +Date(),
            "en"
          )}
        </p>
      </section>
      <section>
        <button
          onMouseEnter={() => {
            setIsHoveringHeart(true);
          }}
          onMouseLeave={() => {
            setIsHoveringHeart(false);
          }}
        >
          {isTrackInLibrary ? (
            <Heart />
          ) : (mouseEnter || isFocusing) && isPlayable ? (
            <HeartShape fill={isHoveringHeart ? "#fff" : "#ffffffb3"} />
          ) : null}
        </button>
        <p className="trackArtists">
          {formatTime((track.duration || 0) / 1000)}
        </p>
        <button className="options">
          {mouseEnter || isFocusing ? (
            <ThreeDots />
          ) : (
            <div style={{ width: "16px" }}></div>
          )}
        </button>
      </section>
      <style jsx>{`
        .trackArtistsContainer {
          display: block;
          align-items: center;
        }
        .options {
          margin-right: 20px;
        }
        .trackItem {
          opacity: ${isPlayable ? 1 : 0.4};
        }
        a {
          text-decoration: none;
          color: ${mouseEnter || isFocusing ? "#fff" : "inherit"};
          margin-right: 5px;
        }
        a:hover {
          text-decoration: underline;
        }
        button {
          display: flex;
          justify-content: center;
          align-items: center;
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          margin: 0 15px 0 15px;
        }
        p.trackName {
          color: ${isTheSameAsCurrentlyPlaying ? "#1db954" : "#fff"};
          margin: 0;
          padding: 0;
        }
        p.trackArtists,
        span {
          margin: 0;
          font-family: "Lato", "sans-serif";
          font-weight: 400;
          color: #b3b3b3;
          font-size: 14px;
        }
        strong {
          font-weight: bold;
        }
        section {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        section:nth-of-type(4) {
          justify-content: flex-end;
        }
        .trackItem {
          width: 100%;
          height: 65px;
          background-color: ${isTheSameAsCurrentlyPlaying
            ? "#202020"
            : "transparent"};
          margin: 0;
          padding: 0;
          border-radius: 2px;
          align-items: center;
          text-decoration: none;
          color: inherit;
          cursor: default;
          user-select: none;
          display: grid;
          grid-gap: 16px;
          grid-template-columns: [index] 48px [first] 6fr [var1] 4fr [var2] 3fr [last] minmax(
              120px,
              1fr
            );
        }
        .trackItem:hover {
          background-color: #202020;
        }
        .trackItem:focus {
          background-color: #ffffff4d;
        }
        img {
          margin: 0;
          padding: 0;
          margin-right: 23px;
        }
      `}</style>
    </div>
  );
};

export default ModalCardTrack;
