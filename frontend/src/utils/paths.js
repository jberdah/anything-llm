import { API_BASE } from "./constants";

const COMMUNITY_HUB_BASE = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://hub.anythingllm.com";


function applyOptions(path, options = {}) {
  let updatedPath = path;
  if (!options || Object.keys(options).length === 0) return updatedPath;

  if (options.search) {
    const searchParams = new URLSearchParams(options.search);
    updatedPath += `?${searchParams.toString()}`;
  }
  return updatedPath;
}

export default {
  home: () => "/",
  login: (noTry = false) => `/login${noTry ? "?nt=1" : ""}`,
  onboarding: {
    home: () => "/onboarding",
    survey: () => "/onboarding/survey",
    llmPreference: () => "/onboarding/llm-preference",
    embeddingPreference: () => "/onboarding/embedding-preference",
    vectorDatabase: () => "/onboarding/vector-database",
    userSetup: () => "/onboarding/user-setup",
    dataHandling: () => "/onboarding/data-handling",
    createWorkspace: () => "/onboarding/create-workspace",
  },
  github: () => "https://github.com/Mintplex-Labs/anything-llm",
  discord: () => "https://discord.com/invite/6UyHPeGZAC",
  docs: () => "https://docs.anythingllm.com",
  mailToMintplex: () => "mailto:team@mintplexlabs.com",
  hosting: () => "https://my.mintplexlabs.com/aio-checkout?product=anythingllm",
  workspace: {
    chat: (slug, options = {}) => applyOptions(`/workspace/${slug}`, options),
    settings: {
      generalAppearance: (slug) => `/workspace/${slug}/settings/general-appearance`,
      chatSettings: (slug, options = {}) => applyOptions(`/workspace/${slug}/settings/chat-settings`, options),
      vectorDatabase: (slug) => `/workspace/${slug}/settings/vector-database`,
      members: (slug) => `/workspace/${slug}/settings/members`,
      agentConfig: (slug) => `/workspace/${slug}/settings/agent-config`,
    },
    thread: (wsSlug, threadSlug) => `/workspace/${wsSlug}/t/${threadSlug}`,
  },
  apiDocs: () => `${API_BASE}/docs`,
  settings: {
    users: () => `/settings/users`,
    invites: () => `/settings/invites`,
    workspaces: () => `/settings/workspaces`,
    chats: () => "/settings/workspace-chats",
    llmPreference: () => "/settings/llm-preference",
    transcriptionPreference: () => "/settings/transcription-preference",
    audioPreference: () => "/settings/audio-preference",
    embedder: {
      modelPreference: () => "/settings/embedding-preference",
      chunkingPreference: () => "/settings/text-splitter-preference",
    },
    embeddingPreference: () => "/settings/embedding-preference",
    vectorDatabase: () => "/settings/vector-database",
    security: () => "/settings/security",
    interface: () => "/settings/interface",
    branding: () => "/settings/branding",
    agentSkills: () => "/settings/agents",
    apiKeys: () => "/settings/api-keys",
    systemPromptVariables: () => "/settings/system-prompt-variables",
    logs: () => "/settings/event-logs",
    privacy: () => "/settings/privacy",
    embedSetup: () => `/settings/embed-config`,
    embedChats: () => `/settings/embed-chats`,
    browserExtension: () => `/settings/browser-extension`,
    experimental: () => `/settings/beta-features`,
  },
  agents: {
    builder: () => `/settings/agents/builder`,
    editAgent: (uuid) => `/settings/agents/builder/${uuid}`,
  },
  communityHub: {
    website: () => COMMUNITY_HUB_BASE,
    viewMoreOfType: (type) => `${COMMUNITY_HUB_BASE}/list/${type}`,
    trending: () => `${COMMUNITY_HUB_BASE}/list/trending`,
    authentication: () => `${COMMUNITY_HUB_BASE}/settings/community-hub/authentication`,
    importItem: (importItemId) => `${COMMUNITY_HUB_BASE}/settings/community-hub/import-item${importItemId ? `${COMMUNITY_HUB_BASE}?id=${importItemId}` : ""}`,
    profile: (username) => username ? `${COMMUNITY_HUB_BASE}/u/${username}` : `${COMMUNITY_HUB_BASE}/me`,
    noPrivateItems: () => "https://docs.anythingllm.com/community-hub/faq#no-private-items",
  },
  experimental: {
    liveDocumentSync: {
      manage: () => `/settings/beta-features/live-document-sync/manage`,
    },
  },
};
