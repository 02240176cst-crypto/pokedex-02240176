
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const PURPLE = '#7C3AED';

export default function PokemonCard({
  pokemon,
  onPress,
}) {
  if (!pokemon) return null;

  const image =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default ||
    pokemon.image ||
    null;

  const name =
    pokemon.name?.charAt(0).toUpperCase() +
    (pokemon.name?.slice(1) || '');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.question}>?</Text>
        </View>
      )}

      <Text style={styles.name}>{name}</Text>

      {pokemon.id != null && (
        <Text style={styles.id}>
          #{String(pokemon.id).padStart(3, '0')}
        </Text>
      )}

      {pokemon.types?.length > 0 && (
        <View style={styles.types}>
          {pokemon.types.map((item) => (
            <Text
              key={item.type?.name || item.name}
              style={styles.type}
            >
              {item.type?.name || item.name}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    margin: 5,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  image: {
    width: 110,
    height: 100,
  },
  placeholder: {
    width: 110,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F0FA',
    borderRadius: 12,
  },
  question: {
    fontSize: 40,
    color: PURPLE,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#241044',
    marginTop: 6,
  },
  id: {
    fontSize: 12,
    color: '#777085',
    marginTop: 3,
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 6,
  },
  type: {
    fontSize: 10,
    color: PURPLE,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    margin: 2,
    textTransform: 'capitalize',
  },
});