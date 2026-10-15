
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

const PURPLE = '#7C3AED';
const API_URL = 'https://pokeapi.co/api/v2/pokemon/';

export default function GameScreen() {
  const [pokemon, setPokemon] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Extra feature: Hint button
  const [showHint, setShowHint] = useState(false);

  const loadRound = useCallback(async () => {
    setLoading(true);
    setError(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setPokemon(null);
    setOptions([]);

    try {
      // Choose four different Pokémon from the original 151.
      const correctId = Math.floor(Math.random() * 151) + 1;
      const wrongIds = [];

      while (wrongIds.length < 3) {
        const id = Math.floor(Math.random() * 151) + 1;

        if (id !== correctId && !wrongIds.includes(id)) {
          wrongIds.push(id);
        }
      }

      const ids = [correctId, ...wrongIds];

      const results = await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`${API_URL}${id}`);

          if (!response.ok) {
            throw new Error('Could not load Pokémon.');
          }

          const data = await response.json();

          return {
            id: data.id,
            name: data.name,
            image:
              data.sprites?.other?.['official-artwork']?.front_default ||
              data.sprites?.front_default,
            types: data.types.map((item) => item.type.name),
          };
        })
      );

      // Shuffle the answer choices.
      const shuffled = [...results].sort(
        () => Math.random() - 0.5
      );

      setPokemon(results[0]);
      setOptions(shuffled);
    } catch (err) {
      console.log('Game loading error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  function answerQuestion(option) {
    if (selectedAnswer !== null || !pokemon) {
      return;
    }

    setSelectedAnswer(option.id);

    if (option.id === pokemon.id) {
      setScore((previous) => previous + 1);

      setStreak((previous) => {
        const newStreak = previous + 1;

        setBestStreak((best) =>
          Math.max(best, newStreak)
        );

        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }

  function getAnswerStyle(option) {
    if (selectedAnswer === null) {
      return styles.answerButton;
    }

    if (option.id === pokemon.id) {
      return [styles.answerButton, styles.correctAnswer];
    }

    if (option.id === selectedAnswer) {
      return [styles.answerButton, styles.wrongAnswer];
    }

    return [styles.answerButton, styles.disabledAnswer];
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>
          Finding a Pokémon...
        </Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Couldn't load this round.
        </Text>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={loadRound}
        >
          <Text style={styles.nextButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === pokemon.id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>
        Who's That Pokémon?
      </Text>

      <Text style={styles.subtitle}>
        Recognise the Pokémon and choose its name!
      </Text>

      {/* Score, streak and best streak */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreNumber}>{score}</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>STREAK</Text>
          <Text style={styles.scoreNumber}>{streak}</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>BEST</Text>
          <Text style={styles.scoreNumber}>{bestStreak}</Text>
        </View>
      </View>

      {/* Pokémon silhouette */}
      <View style={styles.gameCard}>
        <Text style={styles.questionLabel}>
          {answered
            ? 'THE ANSWER IS...'
            : 'GUESS THE POKÉMON'}
        </Text>

        {pokemon.image ? (
          <Image
            source={{ uri: pokemon.image }}
            style={[
              styles.pokemonImage,
              !answered && styles.silhouette,
            ]}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}

        {answered && (
          <Text style={styles.revealedName}>
            {pokemon.name.toUpperCase()}
          </Text>
        )}

        {!answered && (
          <>
            <Text style={styles.hint}>
              Who is hiding in the silhouette?
            </Text>

            {/* Extra feature: Show Hint button */}
            <TouchableOpacity
              style={[
                styles.hintButton,
                showHint && styles.hintButtonUsed,
              ]}
              onPress={() => setShowHint(true)}
              disabled={showHint}
              activeOpacity={0.8}
            >
              <Text style={styles.hintButtonText}>
                {showHint ? 'Hint Used ✓' : '💡 Show Hint'}
              </Text>
            </TouchableOpacity>

            {showHint && (
              <View style={styles.typeHintCard}>
                <Text style={styles.typeHintText}>
                  Type: {pokemon.types.join(', ')}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <Text style={styles.chooseHeading}>
        Choose your answer
      </Text>

      {/* Four answer choices */}
      <View style={styles.answersGrid}>
        {options.map((option, index) => {
          const isRight = option.id === pokemon.id;
          const isSelected = option.id === selectedAnswer;

          return (
            <TouchableOpacity
              key={option.id}
              style={getAnswerStyle(option)}
              onPress={() => answerQuestion(option)}
              disabled={answered}
              activeOpacity={0.8}
            >
              <Text style={styles.answerLetter}>
                {String.fromCharCode(65 + index)}
              </Text>

              <Text
                style={[
                  styles.answerText,
                  answered &&
                    (isRight || isSelected) &&
                    styles.highlightedAnswerText,
                ]}
              >
                {option.name.charAt(0).toUpperCase() +
                  option.name.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Answer feedback */}
      {answered && (
        <View
          style={[
            styles.feedbackCard,
            isCorrect
              ? styles.correctFeedback
              : styles.wrongFeedback,
          ]}
        >
          <Text style={styles.feedbackTitle}>
            {isCorrect ? 'Correct! Great job!' : 'Not quite!'}
          </Text>

          <Text style={styles.feedbackText}>
            {isCorrect
              ? 'You earned one point and extended your streak.'
              : `The correct answer was ${
                  pokemon.name.charAt(0).toUpperCase() +
                  pokemon.name.slice(1)
                }.`}
          </Text>
        </View>
      )}

      {/* Next round button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          !answered && styles.nextButtonDisabled,
        ]}
        onPress={loadRound}
        disabled={!answered}
      >
        <Text style={styles.nextButtonText}>
          Next Pokémon →
        </Text>
      </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    padding: 24,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#241044',
    textAlign: 'center',
  },
  subtitle: {
    color: '#777085',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#777085',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreNumber: {
    fontSize: 25,
    fontWeight: 'bold',
    color: PURPLE,
    marginTop: 4,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 22,
  },
  questionLabel: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pokemonImage: {
    width: 220,
    height: 220,
    marginVertical: 12,
  },
  silhouette: {
    tintColor: '#171323',
  },
  imagePlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    color: PURPLE,
  },
  hint: {
    color: '#777085',
    textAlign: 'center',
  },
  hintButton: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 12,
  },
  hintButtonUsed: {
    backgroundColor: '#DDD6FE',
  },
  hintButtonText: {
    color: PURPLE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  typeHintCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  typeHintText: {
    color: '#5B21B6',
    fontWeight: '600',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  revealedName: {
    color: PURPLE,
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  chooseHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#241044',
    marginBottom: 12,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  answerButton: {
    width: '48%',
    flexGrow: 1,
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  correctAnswer: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  wrongAnswer: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  disabledAnswer: {
    opacity: 0.65,
  },
  answerLetter: {
    color: PURPLE,
    fontWeight: 'bold',
    marginRight: 8,
  },
  answerText: {
    color: '#241044',
    fontWeight: '600',
    flexShrink: 1,
  },
  highlightedAnswerText: {
    color: '#FFFFFF',
  },
  feedbackCard: {
    borderRadius: 13,
    padding: 14,
    marginTop: 18,
  },
  correctFeedback: {
    backgroundColor: '#DCFCE7',
  },
  wrongFeedback: {
    backgroundColor: '#FEE2E2',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#241044',
  },
  feedbackText: {
    color: '#4B4458',
    marginTop: 5,
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#B8A7E8',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: PURPLE,
    marginTop: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 12,
  },
});
