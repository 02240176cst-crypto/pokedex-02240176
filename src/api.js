
const BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

export async function getPokemonList(offset = 123, limit = 20) {
  const response = await fetch(
    `${BASE_URL}?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Pokémon');
  }

  return response.json();
}