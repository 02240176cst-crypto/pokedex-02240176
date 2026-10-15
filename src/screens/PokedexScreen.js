
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getPokemonList } from '../api';

const PURPLE = '#7C3AED';
const PAGE_SIZE = 20;
const START_OFFSET = 176;

const CARD_COLORS = [
  '#F1EAFE',
  '#E5F4FF',
  '#FFF0E5',
  '#E6F8EE',
  '#FFF0F5',
  '#FFF8D9',
];

function getPokemonId(url) {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Reusable card: receives Pokémon information through props.
function PokemonCard({ pokemon, index, onPress }) {
  const id = getPokemonId(pokemon.url);

  const imageUrl =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] },
      ]}
      onPress={onPress}
    >
      <Text style={styles.pokemonNumber}>
        #{String(id).padStart(3, '0')}
      </Text>

      <Image
        source={{ uri: imageUrl }}
        style={styles.pokemonImage}
        resizeMode="contain"
      />

      <Text style={styles.pokemonName}>
        {capitalize(pokemon.name)}
      </Text>

      <Text style={styles.viewDetails}>View details →</Text>
    </Pressable>
  );
}

export default function PokedexScreen({ navigation }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchRetry, setSearchRetry] = useState(0);

  // Refs help prevent repeated requests when scrolling quickly.
  const offsetRef = useRef(START_OFFSET);
  const loadingMoreRef = useRef(false);
  const allPokemonRef = useRef(null);

  // Load the first 20 Pokémon, beginning at offset 176.
  const loadInitialPokemon = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getPokemonList(START_OFFSET, PAGE_SIZE);

      setPokemonList(data.results);
      offsetRef.current = START_OFFSET + data.results.length;
      setHasMore(Boolean(data.next));
    } catch (err) {
      setError('Could not load Pokémon. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialPokemon();
  }, [loadInitialPokemon]);

  // Load the next 20 Pokémon when the user reaches the bottom.
  const loadMorePokemon = useCallback(async () => {
    if (
      loading ||
      loadingMoreRef.current ||
      !hasMore ||
      searchText.trim()
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');

    try {
      const data = await getPokemonList(offsetRef.current, PAGE_SIZE);

      setPokemonList((currentList) => {
        const existingNames = new Set(
          currentList.map((pokemon) => pokemon.name)
        );

        const newPokemon = data.results.filter(
          (pokemon) => !existingNames.has(pokemon.name)
        );

        return [...currentList, ...newPokemon];
      });

      offsetRef.current += data.results.length;
      setHasMore(Boolean(data.next));
    } catch (err) {
      setError('Could not load more Pokémon.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, searchText]);

  // Debounced search: waits 350 ms after the user stops typing.
  useEffect(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError('');

    const timeout = setTimeout(async () => {
      try {
        let pokemon = allPokemonRef.current;

        // Fetch the complete Pokémon list only once.
        if (!pokemon) {
          const response = await fetch(
            'https://pokeapi.co/api/v2/pokemon?limit=2000'
          );

          if (!response.ok) {
            throw new Error('Search request failed');
          }

          const data = await response.json();
          pokemon = data.results;
          allPokemonRef.current = pokemon;
        }

        const matches = pokemon.filter((item) => {
          const id = getPokemonId(item.url);
          return (
            item.name.toLowerCase().includes(query) ||
            String(id) === query.replace(/^#/, '')
          );
        });

        if (!cancelled) {
          setSearchResults(matches);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError('Search failed. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchText, searchRetry]);

  const openDetails = useCallback(
    (pokemon) => {
      navigation.navigate('Detail', {
        id: getPokemonId(pokemon.url),
      });
    },
    [navigation]
  );

  const isSearching = searchText.trim().length > 0;
  const displayedPokemon = isSearching ? searchResults : pokemonList;

  const renderPokemon = ({ item, index }) => (
    <PokemonCard
      pokemon={item}
      index={index}
      onPress={() => openDetails(item)}
    />
  );

  if (loading && pokemonList.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Loading your Pokédex...</Text>

        {!!error && (
          <Pressable style={styles.retryButton} onPress={loadInitialPokemon}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        )}
      </SafeAreaView>
    );
  }

  if (error && pokemonList.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadInitialPokemon}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      <FlatList
        data={displayedPokemon}
        keyExtractor={(item) => item.name}
        renderItem={renderPokemon}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMorePokemon}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>YOUR POKÉMON ADVENTURE</Text>
              <Text style={styles.headerTitle}>Sonam's Pokédex</Text>
              <Text style={styles.headerSubtitle}>
                Discover Pokémon, one at a time.
              </Text>

              <View style={styles.headerPill}>
                <View style={styles.statusDot} />
                <Text style={styles.headerPillText}>
                  Explore • Search • Collect
                </Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchLabel}>Find a Pokémon</Text>

              <View style={styles.searchBox}>
                <Text style={styles.searchSymbol}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or number..."
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {searchText.length > 0 && (
                  <Pressable onPress={() => setSearchText('')}>
                    <Text style={styles.clearSearch}>×</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Search results' : 'Discover Pokémon'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {isSearching
                      ? 'Matching Pokémon'
                      : 'Keep scrolling to discover more'}
                  </Text>
                </View>

                {!isSearching && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{pokemonList.length}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searching ? (
              <>
                <ActivityIndicator color={PURPLE} size="large" />
                <Text style={styles.emptyTitle}>Searching...</Text>
              </>
            ) : searchError ? (
              <>
                <Text style={styles.emptyTitle}>Search unavailable</Text>
                <Text style={styles.emptyText}>{searchError}</Text>
                <Pressable
                  style={styles.retryButton}
                  onPress={() => setSearchRetry((value) => value + 1)}
                >
                  <Text style={styles.retryButtonText}>Retry search</Text>
                </Pressable>
              </>
            ) : isSearching ? (
              <>
                <Text style={styles.emptyTitle}>No Pokémon found</Text>
                <Text style={styles.emptyText}>
                  Try another name or Pokémon number.
                </Text>
              </>
            ) : (
              <Text style={styles.emptyText}>No Pokémon to display.</Text>
            )}
          </View>
        }
        ListFooterComponent={
          <View>
            {loadingMore && !isSearching && (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={PURPLE} />
                <Text style={styles.footerText}>Finding more Pokémon...</Text>
              </View>
            )}

            {!!error && pokemonList.length > 0 && !isSearching && (
              <View style={styles.loadMoreError}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={loadMorePokemon}>
                  <Text style={styles.retryLink}>Tap to retry</Text>
                </Pressable>
              </View>
            )}

            {!hasMore && !isSearching && pokemonList.length > 0 && (
              <Text style={styles.footerText}>
                You've reached the end!
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F8F7FC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: {
    color: '#DDD6FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 9,
  },
  headerSubtitle: {
    color: '#EDE9FE',
    fontSize: 14,
    marginTop: 7,
  },
  headerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D28D9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 18,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A7F3D0',
    marginRight: 8,
  },
  headerPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  searchLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  searchBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchSymbol: {
    fontSize: 27,
    color: PURPLE,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  clearSearch: {
    fontSize: 25,
    color: '#6B7280',
    paddingHorizontal: 5,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countText: {
    color: PURPLE,
    fontWeight: '800',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 28,
  },
  columnWrapper: {
    paddingHorizontal: 14,
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    marginBottom: 12,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pokemonNumber: {
    alignSelf: 'flex-start',
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
  },
  pokemonImage: {
    width: '100%',
    height: 115,
    marginTop: 4,
  },
  pokemonName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  viewDetails: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 12,
    padding: 16,
  },
  loadMoreError: {
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    color: '#1F2937',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 13,
  },
  retryButton: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  retryLink: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
});