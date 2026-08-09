import { invoke } from "@tauri-apps/api/core";

import { translate, type MessageKey } from "@/shared/i18n";

export const HOSTED_COMMUNITY_SUFFIX = "communities.buzz.xyz";
export const HOSTED_COMMUNITY_LIMIT = 5;
export const VALID_HOSTED_COMMUNITY_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type BuilderlabAuth = {
  email?: string;
  name?: string;
  expiresAt: string;
};

export type HostedCommunityApiError = {
  code?: string;
  message?: string;
  setup_needed?: boolean;
};

export type HostedNostrIdentity = {
  npub?: string;
  pubkey_hex?: string;
};

export type HostedIdentityResponse = {
  identity?: HostedNostrIdentity;
  error?: HostedCommunityApiError;
  correlation_id?: string;
};

export type HostedCommunity = {
  id?: string;
  name?: string;
  slug?: string;
  normalized_host?: string;
  owner_pubkey?: string;
  archived_at?: string | null;
};

export type HostedCommunitiesResponse = {
  communities?: HostedCommunity[];
  error?: HostedCommunityApiError;
  correlation_id?: string;
};

export type HostedCommunityAvailabilityResponse = {
  available?: boolean;
  normalized_host?: string;
  error?: HostedCommunityApiError;
  correlation_id?: string;
};

export type HostedCommunityMutationResponse = {
  community?: HostedCommunity;
  error?: HostedCommunityApiError;
  correlation_id?: string;
};

export type HostedCommunityAccount = {
  communities: HostedCommunity[];
  identity: HostedNostrIdentity | null;
};

const HOSTED_ERROR_KEYS: Record<string, MessageKey> = {
  missing_mapping: "hosted.errMissingMapping",
  invalid_name: "hosted.errInvalidName",
  taken: "hosted.errTaken",
  limit_reached: "hosted.limitReached",
  relay_unavailable: "hosted.errRelayUnavailable",
  identity_already_bound: "hosted.errIdentityAlreadyBound",
  pubkey_already_bound: "hosted.errPubkeyAlreadyBound",
  not_owner: "hosted.errNotOwner",
  transferee_not_registered: "hosted.errTransfereeNotRegistered",
};

export function hostedCommunityErrorMessage(
  error: HostedCommunityApiError | undefined,
  correlationId: string | undefined,
  fallbackKey: MessageKey = "hosted.couldNotCreate",
) {
  const key = HOSTED_ERROR_KEYS[error?.code ?? ""];
  const message = key
    ? translate(key, { count: HOSTED_COMMUNITY_LIMIT })
    : (error?.message ?? translate(fallbackKey));
  return correlationId
    ? `${message} ${translate("hosted.correlationId", { id: correlationId })}`
    : message;
}

export function hostedCommunityRelayUrl(community: HostedCommunity) {
  const host = community.normalized_host?.trim();
  return host ? `wss://${host.replace(/^wss?:\/\//, "")}` : null;
}

export function getBuilderlabAuth() {
  return invoke<BuilderlabAuth | null>("get_builderlab_auth");
}

export function cancelBuilderlabLogin() {
  return invoke<void>("cancel_builderlab_login");
}

export function clearBuilderlabAuth() {
  return invoke<void>("clear_builderlab_auth");
}

export function startBuilderlabLogin() {
  return invoke<BuilderlabAuth>("start_builderlab_login");
}

export async function loadHostedCommunityAccount(): Promise<HostedCommunityAccount> {
  const [identityResponse, communitiesResponse] = await Promise.all([
    invoke<HostedIdentityResponse>("get_builderlab_nostr_identity"),
    invoke<HostedCommunitiesResponse>("list_builderlab_communities"),
  ]);
  if (
    identityResponse.error &&
    identityResponse.error.code !== "unauthorized" &&
    !identityResponse.error.setup_needed
  ) {
    throw new Error(
      hostedCommunityErrorMessage(
        identityResponse.error,
        identityResponse.correlation_id,
        "hosted.errLoadIdentity",
      ),
    );
  }
  if (communitiesResponse.error && !communitiesResponse.error.setup_needed) {
    throw new Error(
      hostedCommunityErrorMessage(
        communitiesResponse.error,
        communitiesResponse.correlation_id,
        "hosted.errLoadCommunities",
      ),
    );
  }
  return {
    identity: identityResponse.identity ?? null,
    communities: communitiesResponse.communities ?? [],
  };
}

export function bindBuilderlabIdentity() {
  return invoke<HostedIdentityResponse>("bind_builderlab_nostr_identity");
}

export function deleteBuilderlabIdentity() {
  return invoke<HostedIdentityResponse>("delete_builderlab_nostr_identity");
}

export function checkHostedCommunityName(name: string) {
  return invoke<HostedCommunityAvailabilityResponse>(
    "check_builderlab_community_name",
    { name },
  );
}

export function createHostedCommunity(name: string) {
  return invoke<HostedCommunityMutationResponse>(
    "create_builderlab_community",
    {
      name,
    },
  );
}
