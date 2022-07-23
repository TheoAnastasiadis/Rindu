import Head from "next/head";
import useHeader from "hooks/useHeader";
import { useEffect, ReactElement, useState } from "react";
import PresentationCard from "components/PresentationCard";
import useAuth from "hooks/useAuth";
import { getMyArtists } from "utils/spotifyCalls/getMyArtists";
import useSpotify from "hooks/useSpotify";
import { CardType } from "components/CardContent";
import NavigationTopBarExtraField from "components/NavigationTopBarExtraField";
import ContentContainer from "components/ContentContainer";

export default function CollectionPlaylists(): ReactElement {
  const { setElement, setHeaderColor } = useHeader({ showOnFixed: true });
  const { accessToken } = useAuth();
  const [artists, setArtists] = useState<SpotifyApi.ArtistObjectFull[]>([]);
  const { isPlaying } = useSpotify();

  useEffect(() => {
    setElement(() => <NavigationTopBarExtraField />);

    setHeaderColor("#242424");

    return () => {
      setElement(null);
    };
  }, [setElement, setHeaderColor]);

  useEffect(() => {
    if (!accessToken) return;

    async function getArtists() {
      const artistsObjResponse = await getMyArtists(accessToken as string);
      if (artistsObjResponse?.artists.items) {
        setArtists(artistsObjResponse?.artists.items);
      }
    }
    getArtists();
  }, [accessToken, setArtists]);

  return (
    <ContentContainer>
      {!isPlaying && (
        <Head>
          <title>Rindu - Library</title>
        </Head>
      )}
      <h2>Artists</h2>
      <section>
        {artists?.length > 0
          ? artists.map(({ id, images, name }) => {
              return (
                <PresentationCard
                  type={CardType.ARTIST}
                  key={id}
                  images={images}
                  title={name}
                  subTitle={"Artist"}
                  id={id}
                />
              );
            })
          : null}
      </section>
      <style jsx>{`
        h2 {
          color: #fff;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 28px;
          text-transform: none;
          margin: 0;
        }
        section {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          grid-gap: 24px;
          margin: 20px 0 50px 0;
          justify-content: space-between;
        }
        :global(.extraField-nav li:nth-of-type(3) a) {
          background-color: #343434;
        }
      `}</style>
    </ContentContainer>
  );
}
