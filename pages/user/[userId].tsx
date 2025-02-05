import { ReactElement, useEffect } from "react";

import { decode } from "html-entities";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";

import {
  ContentContainer,
  Grid,
  Heading,
  PageHeader,
  PresentationCard,
} from "components";
import { CardType } from "components/CardContent";
import {
  useAnalytics,
  useAuth,
  useTranslations,
  useUserPlaylists,
} from "hooks";
import { HeaderType } from "types/pageHeader";
import {
  chooseImage,
  fullFilledValue,
  getAuth,
  getTopTracksCards,
  getTranslations,
  Page,
  serverRedirect,
} from "utils";
import { getPlaylistsFromUser, getUserById } from "utils/spotifyCalls";

interface CurrentUserProps {
  currentUser: SpotifyApi.UserObjectPublic | null;
  user: SpotifyApi.UserObjectPrivate | null;
  currentUserPlaylists: SpotifyApi.ListOfUsersPlaylistsResponse | null;
  translations: Record<string, string>;
}

const CurrentUser = ({
  currentUser,
  currentUserPlaylists,
}: InferGetServerSidePropsType<
  typeof getServerSideProps
>): ReactElement | null => {
  const { trackWithGoogleAnalytics } = useAnalytics();
  const { user } = useAuth();
  const { translations } = useTranslations();
  const router = useRouter();
  const playlists = useUserPlaylists();
  const isThisUser = currentUser?.id === user?.id;

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
    trackWithGoogleAnalytics();
  }, [currentUser, router, trackWithGoogleAnalytics]);

  if (!currentUser) {
    return null;
  }

  return (
    <ContentContainer hasPageHeader>
      <PageHeader
        key={currentUser?.uri}
        type={HeaderType.Profile}
        title={currentUser?.display_name ?? ""}
        coverImg={chooseImage(currentUser?.images, 300).url}
        totalPublicPlaylists={currentUserPlaylists?.total ?? 0}
        totalFollowers={currentUser?.followers?.total ?? 0}
        data={currentUser}
      />
      <ContentContainer>
        {isThisUser && (
          <>
            <Heading id={"title-topTracksPlaylistHeading"} number={2}>
              {translations.topTracksPlaylistHeading}
            </Heading>
            <Grid>
              {getTopTracksCards(user, translations).map((item) => {
                if (!item) return null;
                const { images, name, id, subTitle, url } = item;
                return (
                  <PresentationCard
                    type={CardType.SIMPLE}
                    key={name}
                    images={images}
                    title={name}
                    id={id}
                    subTitle={subTitle}
                    url={url}
                  />
                );
              })}
            </Grid>
            {playlists?.length > 0 && (
              <>
                <Heading id={"title-playlist"} number={2}>
                  {translations.yourPlaylists}
                </Heading>
                <Grid>
                  {playlists.map(({ images, name, description, id, owner }) => {
                    return (
                      <PresentationCard
                        type={CardType.PLAYLIST}
                        key={id}
                        images={images}
                        title={name}
                        subTitle={
                          decode(description) ||
                          `${translations.by} ${owner.display_name ?? owner.id}`
                        }
                        id={id}
                      />
                    );
                  })}
                </Grid>
              </>
            )}
          </>
        )}
        {!isThisUser && currentUserPlaylists && (
          <div style={{ marginTop: "16px" }}>
            <Heading id={"title-playlist"} number={2}>
              {translations.playlists}
            </Heading>
            <Grid>
              {currentUserPlaylists?.items.length > 0
                ? currentUserPlaylists?.items?.map(
                    ({ images, name, description, id, owner }) => {
                      return (
                        <PresentationCard
                          type={CardType.PLAYLIST}
                          key={id}
                          images={images}
                          title={name}
                          subTitle={
                            decode(description) ||
                            `${translations.by} ${
                              owner.display_name ?? owner.id
                            }`
                          }
                          id={id}
                        />
                      );
                    }
                  )
                : null}
            </Grid>
          </div>
        )}
      </ContentContainer>
    </ContentContainer>
  );
};

export default CurrentUser;

export const getServerSideProps = (async (context) => {
  const country = (context.query.country ?? "US") as string;
  const translations = getTranslations(country, Page.User);
  const cookies = context.req?.headers?.cookie;

  if (!cookies || !context.params) {
    serverRedirect(context.res, "/");
    return { props: {} };
  }

  const { user } = (await getAuth(context)) ?? {};
  const currentUserProm = getUserById(context.params.userId, context);
  const currentUserPlaylistsProm = getPlaylistsFromUser(
    context.params.userId,
    context
  );

  const [currentUser, currentUserPlaylists] = await Promise.allSettled([
    currentUserProm,
    currentUserPlaylistsProm,
  ]);

  return {
    props: {
      currentUser: fullFilledValue(currentUser),
      user: user ?? null,
      currentUserPlaylists: fullFilledValue(currentUserPlaylists),
      translations,
    },
  };
}) satisfies GetServerSideProps<Partial<CurrentUserProps>, { userId: string }>;
