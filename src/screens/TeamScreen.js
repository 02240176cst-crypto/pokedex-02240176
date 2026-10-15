
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useTeam } from '../context/TeamContext';

const PURPLE = '#7C3AED';

const STAT_NAMES = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Sp. Attack' },
  { key: 'special-defense', label: 'Sp. Defense' },
  { key: 'speed', label: 'Speed' },
];

export default function TeamScreen({ navigation }) {
  const {
    team = [],
    removePokemon,
    isTeamLoaded = true,
  } = useTeam();

  // Calculate the combined base stats of all team members.
  const combinedStats = STAT_NAMES.reduce((totals, stat) => {
    totals[stat.key] = team.reduce((sum, pokemon) => {
      const baseStats = pokemon.stats || [];

      const matchingStat = baseStats.find(
        (item) =>
          item.stat?.name === stat.key ||
          item.name === stat.key
      );

      // Supports both PokeAPI's stats format and stored stat objects.
      const value =
        matchingStat?.base_stat ??
        matchingStat?.baseStat ??
        matchingStat?.value ??
        0;

      return sum + (Number(value) || 0);
    }, 0);

    return totals;
  }, {});

  const getPokemonId = (pokemon) => {
    if (pokemon.id) {
      return pokemon.id;
    }

    if (pokemon.url) {
      const parts = pokemon.url.split('/').filter(Boolean);
      return parts[parts.length - 1];
    }

    return null;
  };

  const getPokemonName = (pokemon) => {
    return (
      pokemon.name?.charAt(0).toUpperCase() +
      (pokemon.name?.slice(1) || '')
    );
  };

  const getPokemonImage = (pokemon) => {
    if (pokemon.sprites?.other?.['official-artwork']?.front_default) {
      return pokemon.sprites.other['official-artwork'].front_default;
    }

    if (pokemon.sprites?.front_default) {
      return pokemon.sprites.front_default;
    }

    const id = getPokemonId(pokemon);

    if (id) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }

    return null;
  };

  const renderPokemon = ({ item }) => {
    const imageUrl = getPokemonImage(item);

    return (
      <View style={styles.pokemonCard}>
        <TouchableOpacity
          style={styles.pokemonInfo}
          onPress={() => {
            const id = getPokemonId(item);

            if (id) {
              navigation.navigate('Detail', { id: Number(id) });
            }
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.pokemonImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>?</Text>
            </View>
          )}

          <View style={styles.nameContainer}>
            <Text style={styles.pokemonName}>
              {getPokemonName(item)}
            </Text>
            <Text style={styles.pokemonSubtitle}>
              Pokémon #{getPokemonId(item) || '?'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removePokemon(item.id ?? item.name)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isTeamLoaded) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Loading your team...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>My Pokémon Squad</Text>
      <Text style={styles.subtitle}>
        Your team, your adventure!
      </Text>

      <View style={styles.countCard}>
        <Text style={styles.countLabel}>TEAM MEMBERS</Text>
        <Text style={styles.countNumber}>
          {team.length}/6
        </Text>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min((team.length / 6) * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.sectionHeading}>Combined Base Stats</Text>

      <View style={styles.statsCard}>
        {STAT_NAMES.map((stat) => (
          <View key={stat.key} style={styles.statRow}>
            <Text style={styles.statName}>{stat.label}</Text>
            <Text style={styles.statValue}>
              {combinedStats[stat.key] || 0}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Base Stats</Text>
          <Text style={styles.totalValue}>
            {Object.values(combinedStats).reduce(
              (sum, value) => sum + value,
              0
            )}
          </Text>
        </View>
      </View>

      <View style={styles.listHeadingRow}>
        <Text style={styles.sectionHeading}>Your Pokémon</Text>
        <Text style={styles.listCount}>{team.length} selected</Text>
      </View>

      {team.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyTitle}>Your squad is empty!</Text>
          <Text style={styles.emptyMessage}>
            Discover Pokémon and add up to six to build your team.
          </Text>
        </View>
      ) : (
        <FlatList
          data={team}
          renderItem={renderPokemon}
          keyExtractor={(item, index) =>
            String(item.id ?? item.name ?? index)
          }
          scrollEnabled={false}
        />
      )}

      <Text style={styles.footer}>
        {6 - team.length} team slot(s) remaining
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  content: {
    padding: 18,
    paddingBottom: 35,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
  },
  heading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#241044',
  },
  subtitle: {
    fontSize: 14,
    color: '#777085',
    marginTop: 5,
    marginBottom: 18,
  },
  countCard: {
    backgroundColor: PURPLE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  countLabel: {
    color: '#EDE9FE',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  countNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  progressBackground: {
    height: 8,
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  sectionHeading: {
    color: '#241044',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },
  statName: {
    color: '#625B71',
    fontSize: 14,
  },
  statValue: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 5,
  },
  totalLabel: {
    color: '#241044',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalValue: {
    color: PURPLE,
    fontWeight: 'bold',
    fontSize: 17,
  },
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCount: {
    color: '#777085',
    fontSize: 12,
  },
  pokemonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  pokemonInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pokemonImage: {
    width: 65,
    height: 65,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F3F0FA',
    borderRadius: 12,
  },
  nameContainer: {
    flex: 1,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#241044',
  },
  pokemonSubtitle: {
    fontSize: 12,
    color: '#8A8398',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  removeButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  emptyEmoji: {
    fontSize: 35,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#241044',
  },
  emptyMessage: {
    color: '#777085',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#777085',
    fontSize: 12,
    marginTop: 15,
  },
  message: {
    color: PURPLE,
    fontSize: 16,
  },
});