import React from "react";
import { User, Story, Conversation } from "../types";
import { Plus, Sparkles, Image as ImageIcon, Video, Type, Lock } from "lucide-react";

interface StoriesBarProps {
  currentUser: User;
  allUsers: User[];
  stories: Story[];
  conversations?: Conversation[];
  onOpenCreator: () => void;
  onOpenStoryViewer: (targetUserId: string, initialStoryIndex?: number) => void;
  className?: string;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  currentUser,
  allUsers,
  stories,
  conversations = [],
  onOpenCreator,
  onOpenStoryViewer,
  className = ""
}) => {
  // Group stories by userId
  const myStories = stories.filter((s) => s.userId === currentUser.id);

  // Group stories for other users, respecting privacy & user hide lists
  const userStoryMap = new Map<string, { user: User; stories: Story[]; hasUnviewed: boolean }>();

  stories.forEach((story) => {
    if (story.userId === currentUser.id) return;

    // Check if story is hidden from current user
    if (story.hiddenFromUserIds && story.hiddenFromUserIds.includes(currentUser.id)) {
      return;
    }

    const userObj = allUsers.find((u) => u.id === story.userId) || {
      id: story.userId,
      username: story.userName,
      avatar: story.userAvatar,
      email: "",
      status: "online",
      isPrivate: false,
      createdAt: story.createdAt
    };

    // If profile is private, check if they share a direct conversation/contact
    if (userObj.isPrivate) {
      const isDirectContact = conversations.some(
        (c) =>
          c.type === "dm" &&
          c.participants.includes(currentUser.id) &&
          c.participants.includes(story.userId)
      );
      if (!isDirectContact) {
        return; // Private profile story not accessible
      }
    }
    
    let entry = userStoryMap.get(story.userId);
    if (!entry) {
      entry = { user: userObj, stories: [], hasUnviewed: false };
      userStoryMap.set(story.userId, entry);
    }
    entry.stories.push(story);
    const isViewed = story.viewers.some((v) => v.userId === currentUser.id);
    if (!isViewed) {
      entry.hasUnviewed = true;
    }
  });

  const otherUsersWithStories = Array.from(userStoryMap.values()).sort((a, b) => {
    // Unviewed stories first, then most recently created story
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    const aLatest = Math.max(...a.stories.map((s) => new Date(s.createdAt).getTime()));
    const bLatest = Math.max(...b.stories.map((s) => new Date(s.createdAt).getTime()));
    return bLatest - aLatest;
  });

  return (
    <div
      id="stories-bar"
      className={`flex items-center gap-3 overflow-x-auto py-2.5 px-3 scrollbar-none select-none bg-[#09112a]/90 backdrop-blur-md border-b border-blue-950/70 shadow-sm ${className}`}
    >
      {/* 1. My Story Card / Add Story button */}
      <div className="flex flex-col items-center shrink-0 cursor-pointer group" id="my-story-card">
        <div className="relative">
          <button
            onClick={() => {
              if (myStories.length > 0) {
                onOpenStoryViewer(currentUser.id, 0);
              } else {
                onOpenCreator();
              }
            }}
            className={`w-14 h-14 rounded-2xl p-0.5 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 ${
              myStories.length > 0
                ? "bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-md shadow-blue-500/25"
                : "bg-slate-800/80 border border-slate-700/80 hover:border-cyan-400/60"
            }`}
            title={myStories.length > 0 ? "View your active stories" : "Create a new story"}
          >
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-full h-full object-cover"
              />
              {myStories.length > 0 && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
                </div>
              )}
            </div>
          </button>

          {/* Quick Plus (+) or Add Badge */}
          <button
            id="add-story-plus-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreator();
            }}
            title="Create Story"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-[#09112a] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        <span className="text-[11px] font-medium text-slate-200 mt-1.5 truncate max-w-[64px] text-center leading-tight">
          {myStories.length > 0 ? `Your Story (${myStories.length})` : "Add Story"}
        </span>
      </div>

      {/* Vertical Subtle Divider */}
      <div className="h-10 w-[1px] bg-slate-800/80 shrink-0 mx-0.5" />

      {/* 2. Other Users' Stories */}
      {otherUsersWithStories.map(({ user, stories: userStories, hasUnviewed }) => {
        const latestStory = userStories[userStories.length - 1];
        return (
          <div
            key={user.id}
            id={`story-avatar-${user.id}`}
            onClick={() => onOpenStoryViewer(user.id, 0)}
            className="flex flex-col items-center shrink-0 cursor-pointer group transition-transform active:scale-95"
            title={`View ${user.username}'s ${userStories.length} ${userStories.length === 1 ? "story" : "stories"}`}
          >
            <div className="relative">
              {/* Outer Ring */}
              <div
                className={`w-14 h-14 rounded-2xl p-[2px] transition-all group-hover:scale-105 ${
                  hasUnviewed
                    ? "bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-md shadow-indigo-500/25 animate-pulse"
                    : "bg-slate-700/60 hover:bg-slate-600/80"
                }`}
              >
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 border-2 border-[#09112a] relative">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                  {/* Media Type Icon Badge */}
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm rounded-full p-0.5">
                    {latestStory.type === "video" ? (
                      <Video className="w-2.5 h-2.5 text-cyan-300" />
                    ) : latestStory.type === "text" ? (
                      <Type className="w-2.5 h-2.5 text-purple-300" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5 text-emerald-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Story count badge */}
              {userStories.length > 1 && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 border border-[#09112a] text-[9px] font-bold text-white shadow-sm">
                  {userStories.length}
                </div>
              )}
            </div>

            <span className="text-[11px] font-medium text-slate-300 group-hover:text-cyan-400 mt-1.5 truncate max-w-[68px] text-center leading-tight transition-colors">
              {user.username.split(" ")[0]}
            </span>
          </div>
        );
      })}

      {/* If no other users have stories, show a friendly prompt */}
      {otherUsersWithStories.length === 0 && myStories.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-900/40 text-slate-400 text-xs shrink-0">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>No active stories yet. Share a photo, 60s video, or styled text!</span>
        </div>
      )}
    </div>
  );
};
