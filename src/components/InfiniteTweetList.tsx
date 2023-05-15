import Link from "next/link";
import { type ButtonHTMLAttributes, type FC } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { useSession } from "next-auth/react";
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: {
    id: string;
    image: string | null;
    name: string | null;
  };
};

interface InfiniteTweetListProps {
  isError: boolean;
  isLoading: boolean;
  hasMore: boolean;
  fetchMoreTweets: () => Promise<unknown>;
  tweets?: Tweet[];
}

export const InfiniteTweetList: FC<InfiniteTweetListProps> = ({
  tweets,
  isError,
  isLoading,
  hasMore,
  fetchMoreTweets,
}) => {
  if (isError) return <h1>Error...</h1>;
  if (isLoading) return <LoadingSpinner />;
  if (tweets?.length === 0 || !tweets)
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );
  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchMoreTweets}
        hasMore={hasMore}
        loader={<LoadingSpinner />}
      >
        {tweets.map((tweet) => {
          return <TweetCard key={tweet.id} {...tweet} />;
        })}
      </InfiniteScroll>
    </ul>
  );
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

const TweetCard: FC<Tweet> = ({
  content,
  id,
  user,
  createdAt,
  likeCount,
  likedByMe,
}) => {
  const trpcUtils = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (!oldData) return;
        const countModifier = addedLike ? 1 : -1;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((tweet) => {
              if (tweet.id === id) {
                return {
                  ...tweet,
                  likedByMe: !tweet.likedByMe,
                  likeCount: tweet.likeCount + countModifier,
                };
              }
              return tweet;
            }),
          })),
        };
      };
      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcUtils.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: user.id },
        updateData
      );
    },
  });

  const handleToggleLike = () => {
    toggleLike.mutate({ id });
  };

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image} />
      </Link>
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link
            className="font-bold hover:underline focus-visible:underline"
            href={`/profiles/${user.id}`}
          >
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(createdAt)}
          </span>
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
        <HeartButton
          likedByMe={likedByMe}
          likedCount={likeCount}
          onClick={handleToggleLike}
          isLoading={toggleLike.isLoading}
        />
      </div>
    </li>
  );
};

interface HeartButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  likedByMe: boolean;
  likedCount: number;
  isLoading?: boolean;
}

const HeartButton: FC<HeartButtonProps> = ({
  likedByMe,
  likedCount,
  isLoading,
  ...props
}) => {
  const session = useSession();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (session.status !== "unauthenticated") {
    return (
      <button
        className={`group flex items-center gap-1 self-start transition-colors duration-200 ${
          likedByMe
            ? "text-red-500"
            : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
        }`}
        disabled={isLoading}
        {...props}
      >
        <IconHoverEffect red>
          <HeartIcon
            className={`transition-colors duration-200 ${
              likedByMe
                ? "fill-red-500"
                : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
            }`}
          />
        </IconHoverEffect>
        <span>{likedCount}</span>
      </button>
    );
  }
  return <h1>Heart</h1>;
};
