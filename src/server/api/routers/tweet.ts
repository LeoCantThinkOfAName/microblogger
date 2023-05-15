import {
  type createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { z } from "zod";
import { type Prisma } from "@prisma/client";
import { type inferAsyncReturnType } from "@trpc/server";

async function getInfiniteFeeds({
  whereClause,
  ctx,
  limit,
  cursor,
}: {
  whereClause?: Prisma.TweetWhereInput;
  limit: number;
  cursor: { id: string; createAt: Date } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currentUserId = ctx.session?.user.id;

  const data = await ctx.prisma.tweet.findMany({
    take: limit + 1,
    cursor: cursor ? { createAt_id: cursor } : undefined,
    where: whereClause,
    orderBy: [{ createAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      content: true,
      createAt: true,
      _count: { select: { likes: true } },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
      user: {
        select: {
          name: true,
          id: true,
          image: true,
        },
      },
    },
  });
  let nextCursor: typeof cursor | undefined;
  if (data.length > limit) {
    const nextItem = data.pop();
    if (nextItem) {
      nextCursor = { id: nextItem.id, createAt: nextItem.createAt };
    }
  }

  return {
    data: data.map((tweet) => ({
      id: tweet.id,
      content: tweet.content,
      createdAt: tweet.createAt,
      likeCount: tweet._count.likes,
      user: tweet.user,
      likedByMe: !!tweet.likes?.length,
    })),
    nextCursor,
  };
}

export const tweetRouter = createTRPCRouter({
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createAt: z.date() }).optional(),
      })
    )
    .query(async ({ input: { userId, limit = 10, cursor }, ctx }) => {
      return await getInfiniteFeeds({
        ctx,
        limit,
        cursor,
        whereClause: { userId },
      });
    }),

  infiniteFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        onlyFollowing: z.boolean().optional(),
        cursor: z.object({ id: z.string(), createAt: z.date() }).optional(),
      })
    )
    .query(
      async ({ input: { limit = 10, onlyFollowing = false, cursor }, ctx }) => {
        const currentUserId = ctx.session?.user.id;
        return await getInfiniteFeeds({
          ctx,
          limit,
          cursor,
          whereClause:
            currentUserId == null || !onlyFollowing
              ? undefined
              : {
                  user: {
                    followers: { some: { id: currentUserId } },
                  },
                },
        });
      }
    ),
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({
        data: { content, userId: ctx.session.user.id },
      });

      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);
      return tweet;
    }),
  toggleLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const data = { tweetId: id, userId: ctx.session.user.id };
      const existingTweet = await ctx.prisma.like.findUnique({
        where: { userId_tweetId: data },
      });

      if (existingTweet) {
        await ctx.prisma.like.delete({ where: { userId_tweetId: data } });
        return { addedLike: false };
      } else {
        await ctx.prisma.like.create({ data });
        return { addedLike: true };
      }
    }),
});
