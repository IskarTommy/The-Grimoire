const query = `query { Page(page: 1, perPage: 50) { media(type: MANGA, sort: TRENDING_DESC) { id title { romaji english } coverImage { extraLarge color } bannerImage countryOfOrigin description(asHtml: false) status chapters averageScore genres relations { edges { relationType(version: 2) node { type format status } } } } } }`;

fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
