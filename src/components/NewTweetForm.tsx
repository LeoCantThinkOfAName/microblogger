import {
  useState,
  type FC,
  type ChangeEvent,
  useRef,
  useLayoutEffect,
  useCallback,
  type FormEvent,
} from "react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
  if (!textArea) return;
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

const Form: FC = () => {
  const trpcUtils = api.useContext();
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const createTweet = api.tweet.create.useMutation({
    onSuccess: (newTweet) => {
      if (session.status !== "authenticated") return;
      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, (oldData) => {
        if (oldData == null || oldData.pages[0] == null) return;

        const newCacheTweet = {
          id: newTweet.id,
          createdAt: newTweet.createAt,
          content: newTweet.content,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data.user.id,
            name: session.data.user.name || null,
            image: session.data.user.image || null,
          },
        };

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              data: [newCacheTweet, ...oldData.pages[0].data],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });
      setInputValue("");
    },
  });
  const textAreaRef = useRef<HTMLTextAreaElement>();
  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaSize(textArea);
    textAreaRef.current = textArea;
  }, []);

  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef.current);
  }, [inputValue]);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createTweet.mutate({ content: inputValue });
  };

  if (session.status !== "authenticated") return null;

  return (
    <form
      className="flex flex-col gap-2 border-b px-4 py-2"
      onSubmit={onSubmit}
    >
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea
          ref={inputRef}
          style={{ height: 0 }}
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          placeholder="What's happening?"
          value={inputValue}
          onChange={onChange}
        />
      </div>
      <Button className="self-end">Post</Button>
    </form>
  );
};

export const NewTweetForm: FC = () => {
  const session = useSession();
  if (session.status !== "authenticated") return null;
  return <Form />;
};
