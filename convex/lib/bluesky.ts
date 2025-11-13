type ExtractedBlueSky = {
  uri: string;
  text: string;
  createdAt?: string;
  author?: { handle?: string; did?: string; displayName?: string };
  images: { url: string; thumb?: string; alt?: string }[];
  external?: {
    uri?: string;
    title?: string;
    description?: string;
    thumb?: string;
  };
  video?: { thumbnail?: string; playlist?: string; cid?: string; alt?: string };
  quote?: ExtractedBlueSky;
};

const APPVIEW = 'https://public.api.bsky.app';

function parseBskyPostUrl(input: string): { actor: string; rkey: string } {
  const url = new URL(input);
  const parts = url.pathname.split('/').filter(Boolean);
  // Expect: /profile/{actor}/post/{rkey}
  if (url.hostname !== 'bsky.app' || parts[0] !== 'profile' || parts[2] !== 'post') {
    throw new Error(`Invalid post URL. We currently only support Bsky: ${input}`);
  }
  const actor = decodeURIComponent(parts[1]);
  const rkey = decodeURIComponent(parts[3]);
  if (!actor || !rkey) throw new Error('Resolve failed: missing actor or rkey.');
  return { actor, rkey };
}

async function resolveDid(actor: string): Promise<string> {
  if (actor.startsWith('did:')) return actor;
  const res = await fetch(`${APPVIEW}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(actor)}`, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`resolveHandle failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { did?: string };
  if (!json.did) throw new Error('Missing DID.');
  return json.did;
}

function toAtUri(did: string, rkey: string): string {
  return `at://${did}/app.bsky.feed.post/${rkey}`;
}

async function getPostView(atUri: string): Promise<any> {
  const url = `${APPVIEW}/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(atUri)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`getPosts failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  const post = json?.posts?.[0];
  if (!post) throw new Error('Post not found (may have been deleted or is not visible).');
  return post;
}

function harvestEmbeds(embed: any): Partial<ExtractedBlueSky> {
  const out: Partial<ExtractedBlueSky> = { images: [] };
  if (!embed || typeof embed !== 'object') return out;

  const type: string | undefined = embed.$type || embed.py_type || embed.type;

  // recordWithMedia: 包含 media 与 record（常见“带图的引用贴”）
  if (type?.includes('app.bsky.embed.recordWithMedia')) {
    const media = embed.media ?? embed.view?.media;
    const record = embed.record ?? embed.view?.record;
    Object.assign(out, harvestEmbeds(media));
    if (record?.uri) out.quote = { uri: record.uri, images: [], text: '' };
    return out;
  }

  // images
  if (type?.includes('app.bsky.embed.images')) {
    const imgs = embed.images ?? embed.view?.images;
    if (Array.isArray(imgs)) {
      out.images = imgs.map((img: any) => ({
        url: img.fullsize ?? img.image, // AppView 提供 fullsize/thumb
        thumb: img.thumb,
        alt: img.alt
      }));
    }
    return out;
  }

  // external (链接卡片)
  if (type?.includes('app.bsky.embed.external')) {
    const ex = embed.external ?? embed.view?.external;
    if (ex) {
      out.external = {
        uri: ex.uri,
        title: ex.title,
        description: ex.description,
        thumb: ex.thumb
      };
    }
    return out;
  }

  // 纯 record（引用）
  if (type?.includes('app.bsky.embed.record')) {
    const record = embed.record ?? embed.view?.record;
    if (record?.uri) out.quote = { uri: record.uri, images: [], text: '' };
    return out;
  }

  // video（AppView 的 view 中常见到 thumbnail/playlist/cid/alt）
  if (type?.includes('app.bsky.embed.video')) {
    const v = embed.view ?? embed;
    out.video = {
      thumbnail: v.thumbnail,
      playlist: v.playlist,
      cid: v.cid,
      alt: v.alt
    };
    return out;
  }

  return out;
}

function flattenPost(view: any): ExtractedBlueSky {
  const record = view.record ?? {};
  const base: ExtractedBlueSky = {
    uri: view.uri,
    text: record.text ?? '',
    createdAt: record.createdAt ?? view.indexedAt,
    author: {
      handle: view.author?.handle,
      did: view.author?.did,
      displayName: view.author?.displayName
    },
    images: []
  };

  const fromEmbed = harvestEmbeds(view.embed);
  if (fromEmbed.images?.length) base.images = fromEmbed.images;
  if (fromEmbed.external) base.external = fromEmbed.external;
  if (fromEmbed.video) base.video = fromEmbed.video;
  if (fromEmbed.quote) base.quote = fromEmbed.quote;

  return base;
}

async function expandQuoteIfAny(obj: ExtractedBlueSky): Promise<void> {
  if (obj.quote?.uri) {
    const quoted = await getPostView(obj.quote.uri);
    obj.quote = flattenPost(quoted);
    // 可选：不要再递归展开更深层级；若需要，递归调用 expandQuoteIfAny(obj.quote!)
  }
}

export async function getBlueSkyPostFromUrl(inputUrl: string) {
  const { actor, rkey } = parseBskyPostUrl(inputUrl);
  const did = await resolveDid(actor);
  const atUri = toAtUri(did, rkey);
  const postView = await getPostView(atUri);
  const extracted = flattenPost(postView);
  await expandQuoteIfAny(extracted);
  return extracted;
}
