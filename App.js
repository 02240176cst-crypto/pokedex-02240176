
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { TeamProvider } from './src/context/TeamContext';

import PokedexScreen from './src/screens/PokedexScreen';
import TeamScreen from './src/screens/TeamScreen';
import GameScreen from './src/screens/GameScreen';
import DetailScreen from './src/screens/DetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PURPLE = '#7C3AED';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: PURPLE,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDE9FE',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={PokedexScreen}
        options={{
          title: 'Pokémon Discover',
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name={focused ? 'compass' : 'search'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="My Squad"
        component={TeamScreen}
        options={{
          title: 'My Pokémon Squad',
          tabBarLabel: 'My Squad',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name={focused ? 'users' : 'user'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: "Who's That Pokémon?",
          tabBarLabel: 'Play',
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="play-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <TeamProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={MainTabs}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{
              title: 'Pokémon Details',
              headerStyle: {
                backgroundColor: PURPLE,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </TeamProvider>
  );
}