
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const TeamContext = createContext(null);

const STORAGE_KEY = '@pokemon_team';
const MAX_TEAM_SIZE = 6;

export function TeamProvider({ children }) {
  const [team, setTeam] = useState([]);
  const [isTeamLoaded, setIsTeamLoaded] = useState(false);

  // Load the saved team when the app starts.
  useEffect(() => {
    async function loadTeam() {
      try {
        const savedTeam = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedTeam) {
          const parsedTeam = JSON.parse(savedTeam);

          if (Array.isArray(parsedTeam)) {
            const uniqueTeam = [];
            const seenIds = new Set();

            for (const pokemon of parsedTeam) {
              if (pokemon?.id == null) {
                continue;
              }

              const id = String(pokemon.id);

              if (
                !seenIds.has(id) &&
                uniqueTeam.length < MAX_TEAM_SIZE
              ) {
                uniqueTeam.push(pokemon);
                seenIds.add(id);
              }
            }

            setTeam(uniqueTeam);
          }
        }
      } catch (error) {
        console.log('Could not load saved team:', error);
      } finally {
        setIsTeamLoaded(true);
      }
    }

    loadTeam();
  }, []);

  // Save changes after the initial team has loaded.
  useEffect(() => {
    if (!isTeamLoaded) {
      return;
    }

    async function saveTeam() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(team)
        );
      } catch (error) {
        console.log('Could not save team:', error);
      }
    }

    saveTeam();
  }, [team, isTeamLoaded]);

  // Check whether a Pokémon is already in the team.
  function isInTeam(id) {
    return team.some(
      (pokemon) => String(pokemon.id) === String(id)
    );
  }

  // Add a Pokémon if the team has space and no duplicate exists.
  function addPokemon(pokemon) {
    if (!pokemon || pokemon.id == null) {
      return {
        success: false,
        message: 'Invalid Pokémon data.',
      };
    }

    const id = String(pokemon.id);

    if (isInTeam(id)) {
      return {
        success: false,
        message: 'This Pokémon is already in your team.',
      };
    }

    if (team.length >= MAX_TEAM_SIZE) {
      return {
        success: false,
        message: 'Your team is full. Remove a Pokémon first.',
      };
    }

    setTeam((currentTeam) => {
      // Check again against the latest state.
      if (
        currentTeam.length >= MAX_TEAM_SIZE ||
        currentTeam.some(
          (item) => String(item.id) === id
        )
      ) {
        return currentTeam;
      }

      return [...currentTeam, pokemon];
    });

    return {
      success: true,
      message: 'Pokémon added to your team!',
    };
  }

  // Remove a Pokémon by its ID.
  function removePokemon(id) {
    const exists = team.some(
      (pokemon) => String(pokemon.id) === String(id)
    );

    if (!exists) {
      return {
        success: false,
        message: 'Pokémon was not found in your team.',
      };
    }

    setTeam((currentTeam) =>
      currentTeam.filter(
        (pokemon) => String(pokemon.id) !== String(id)
      )
    );

    return {
      success: true,
      message: 'Pokémon removed from your team.',
    };
  }

  const value = {
    team,
    teamCount: team.length,
    maxTeamSize: MAX_TEAM_SIZE,
    isTeamLoaded,
    isTeamFull: team.length >= MAX_TEAM_SIZE,
    isInTeam,
    addPokemon,
    removePokemon,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);

  if (!context) {
    throw new Error(
      'useTeam must be used inside a TeamProvider.'
    );
  }

  return context;
}