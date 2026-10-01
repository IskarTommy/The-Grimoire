const axios = require('axios');

async function getEnrichedManga(id) {
  const mangaQuery = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        countryOfOrigin
        description(asHtml: false)
        status
        chapters
        volumes
        averageScore
        popularity
        favourites
        genres
        tags {
          id
          name
          description
          category
          rank
          isMediaSpoiler
        }
        startDate { year month day }
        endDate { year month day }
        rankings {
          id
          rank
          type
          allTime
          context
          year
        }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 20) {
          edges {
            role
            node {
              id
              name { full native alternative }
              image { large medium }
            }
          }
        }
        staff(sort: [RELEVANCE, ID], perPage: 16) {
          edges {
            role
            node {
              id
              name { full native }
              image { large medium }
            }
          }
        }
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              type
              format
              status
              title { romaji english }
              coverImage { large medium color }
              bannerImage
              chapters
              episodes
              averageScore
              startDate { year }
            }
          }
        }
        externalLinks {
          id
          url
          site
          icon
          color
        }
      }
    }
  `;

  const start = Date.now();
  const res = await axios.post('https://graphql.anilist.co', { query: mangaQuery, variables: { id } });
  const manga = res.data?.data?.Media;
  if (!manga) return null;

  // Check for anime adaptation
  const animeRelation = manga.relations?.edges?.find(
    (e) => e.node?.type === 'ANIME' && ['ADAPTATION', 'ALTERNATIVE', 'PARENT'].includes(e.relationType)
  );

  if (animeRelation?.node?.id) {
    const animeId = animeRelation.node.id;
    const animeVaQuery = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
            edges {
              node { id }
              voiceActors(language: JAPANESE) {
                id
                name { full native }
                image { large medium }
                languageV2
              }
            }
          }
        }
      }
    `;
    try {
      const animeRes = await axios.post('https://graphql.anilist.co', { query: animeVaQuery, variables: { id: animeId } });
      const vaMap = new Map();
      for (const edge of animeRes.data?.data?.Media?.characters?.edges || []) {
        if (edge.node?.id && edge.voiceActors?.length > 0) {
          vaMap.set(edge.node.id, edge.voiceActors[0]);
        }
      }

      // Attach voice actor to manga characters
      for (const charEdge of manga.characters?.edges || []) {
        const va = vaMap.get(charEdge.node?.id);
        if (va) {
          charEdge.voiceActor = va;
        }
      }
    } catch (err) {
      console.warn('Could not fetch anime voice actors:', err.message);
    }
  }

  console.log(`[${id}] Enriched in ${Date.now() - start}ms:`, {
    title: manga.title.english || manga.title.romaji,
    charactersWithVA: manga.characters?.edges?.filter(e => e.voiceActor).length,
    totalCharacters: manga.characters?.edges?.length
  });

  return manga;
}

async function run() {
  const csm = await getEnrichedManga(105778); // Chainsaw Man
  console.log('CSM First 2 characters with voice actors:');
  console.log(csm.characters.edges.slice(0, 2).map(e => ({
    character: e.node.name.full,
    role: e.role,
    voiceActor: e.voiceActor?.name?.full
  })));
}

run();
