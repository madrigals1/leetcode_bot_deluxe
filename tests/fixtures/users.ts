import type { User } from "@/services/backend";

export const alice: User = {
  id: 1,
  url: "https://leetcode.com/alice/",
  username: "alice",
  solved: 120,
  solved_cml: 320.5,
  data: {
    profile: {
      realName: "Alice A",
      userAvatar: "https://avatar.example/alice.png",
    },
    submitStats: {
      acSubmissionNum: [
        { difficulty: "Easy", count: 60 },
        { difficulty: "Medium", count: 45 },
        { difficulty: "Hard", count: 15 },
      ],
    },
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
};

export const bob: User = {
  id: 2,
  url: "https://leetcode.com/bob/",
  username: "bob",
  solved: 0,
  solved_cml: 0,
  data: {
    profile: {
      realName: undefined,
      userAvatar: undefined,
    },
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

/** User with submissions and language stats, for chart/profile handlers. */
export const trackedAlice: User = {
  ...alice,
  data: {
    profile: { realName: "Alice A", userAvatar: "https://avatar.example/alice.png" },
    submitStats: {
      acSubmissionNum: [
        { difficulty: "Easy", count: 60 },
        { difficulty: "Medium", count: 45 },
        { difficulty: "Hard", count: 15 },
        { difficulty: "All", count: 120 },
      ],
      totalSubmissionNum: [
        { difficulty: "All", count: 200 },
      ],
    },
    computed: {
      submissions: [
        {
          name: "Two Sum",
          time: "2024-01-01T00:00:00Z",
          language: "python3",
          status: "Accepted",
          link: "",
          memory: "14 MB",
          runtime: "40 ms",
        },
        {
          name: "Add Two Numbers",
          time: "2024-01-01T00:01:00Z",
          language: "python3",
          status: "Accepted",
          link: "",
          memory: "15 MB",
          runtime: "80 ms",
        },
      ],
    },
    languageStats: [
      { languageName: "Python3", problemsSolved: 90 },
      { languageName: "SQL", problemsSolved: 30 },
    ],
  },
};