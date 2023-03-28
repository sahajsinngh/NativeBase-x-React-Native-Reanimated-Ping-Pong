import React from "react";
import { Box, NativeBaseProvider, Text } from "native-base";

import Game from "./Game";
import Reanimated from "./Test";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <NativeBaseProvider>
      <GestureHandlerRootView>
        <Game />
      </GestureHandlerRootView>
    </NativeBaseProvider>
  );
}
