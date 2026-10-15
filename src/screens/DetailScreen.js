
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTeam } from '../context/TeamContext';

const PURPLE = '#7C3AED';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Special Attack',
  'special-defense': 'Special Defense',
  speed: 'Speed',
};

export default function DetailScreen({ route }) {
  const { id } = route.params;

  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [teamMessage, setTeamMessage] = useState('');

  const {
    isTeamLoaded,
    isTeamFull,
    isInTeam,
    addPokemon,
    removePokemon,
  } = useTeam();

  useEffect(() => {
    let cancelled = false;

    async function fetchPokemon() {
      setLoading(true);
      setError('');
      setTeamMessage('');

      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${id}`
        );

        if (!response.ok) {
          throw new Error('Could not find this Pokémon.');
        }

        const data = await response.json();

        if (!cancelled) {
          setPokemon(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Something went wrong. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPokemon();

    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  async function toggleTeam() {
    if (!pokemon || !isTeamLoaded) {
      return;
    }

    setTeamMessage('');

    if (isInTeam(pokemon.id)) {
      const result = await removePokemon(pokemon.id);

      setTeamMessage(
        result.success
          ? 'Removed from your team.'
          : 'Could not update your team. Please try again.'
      );

      return;
    }

    if (isTeamFull) {
      setTeamMessage('Your team is full. Remove a Pokémon first.');
      return;
    }

    const result = await addPokemon({
      id: pokemon.id,
      name: pokemon.name,
      image:
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        null,
      types: pokemon.types.map((item) => item.type.name),
      stats: pokemon.stats.map((item) => ({
        name: item.stat.name,
        base_stat: item.base_stat,
      })),
    });

    setTeamMessage(result.message);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.infoText}>Loading Pokémon details...</Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load Pokémon</Text>
        <Text style={styles.infoText}>
          {error || 'Please try again.'}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setRetryCount((count) => count + 1)}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const artwork =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  const alreadyInTeam = isInTeam(pokemon.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.pokemonId}>
            #{String(pokemon.id).padStart(3, '0')}
          </Text>

          <Text style={styles.pokemonName}>
            {pokemon.name.charAt(0).toUpperCase() +
              pokemon.name.slice(1)}
          </Text>

          {artwork ? (
            <Image
              source={{ uri: artwork }}
              style={styles.artwork}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noArtwork}>
              <Text style={styles.infoText}>No artwork available</Text>
            </View>
          )}

          <View style={styles.typesContainer}>
            {pokemon.types.map((item) => (
              <View key={item.type.name} style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {item.type.name.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.measurements}>
          <View style={styles.measurementCard}>
            <Text style={styles.measurementLabel}>HEIGHT</Text>
            <Text style={styles.measurementValue}>
              {(pokemon.height / 10).toFixed(1)} m
            </Text>
          </View>

          <View style={styles.measurementCard}>
            <Text style={styles.measurementLabel}>WEIGHT</Text>
            <Text style={styles.measurementValue}>
              {(pokemon.weight / 10).toFixed(1)} kg
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Base Stats</Text>

          {pokemon.stats.map((item) => {
            const value = item.base_stat;
            const percentage = Math.min((value / 255) * 100, 100);

            return (
              <View key={item.stat.name} style={styles.statRow}>
                <Text style={styles.statName}>
                  {STAT_LABELS[item.stat.name] || item.stat.name}
                </Text>

                <Text style={styles.statValue}>{value}</Text>

                <View style={styles.statBarBackground}>
                  <View
                    style={[
                      styles.statBarFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.teamButton,
            alreadyInTeam && styles.removeButton,
            isTeamFull && !alreadyInTeam && styles.disabledButton,
            !isTeamLoaded && styles.disabledButton,
          ]}
          onPress={toggleTeam}
          disabled={
            !isTeamLoaded ||
            (!alreadyInTeam && isTeamFull)
          }
        >
          <Text style={styles.buttonText}>
            {!isTeamLoaded
              ? 'Loading Team...'
              : alreadyInTeam
              ? 'Remove from Team'
              : isTeamFull
              ? 'Team Full (6/6)'
              : 'Add to Team'}
          </Text>
        </TouchableOpacity>

        {teamMessage ? (
          <Text style={styles.teamMessage}>{teamMessage}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  pokemonId: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  pokemonName: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'capitalize',
    marginTop: 5,
  },
  artwork: {
    width: 230,
    height: 230,
    marginVertical: 8,
  },
  noArtwork: {
    height: 100,
    justifyContent: 'center',
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  typeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  measurements: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  measurementLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  measurementValue: {
    color: '#111827',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 14,
  },
  statRow: {
    marginBottom: 16,
  },
  statName: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },
  statValue: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statBarBackground: {
    height: 9,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: PURPLE,
    borderRadius: 10,
  },
  teamButton: {
    backgroundColor: PURPLE,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  removeButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  teamMessage: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});