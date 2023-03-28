import {
  Box,
  Text,
  Button,
  useColorMode,
  useColorModeValue,
  StatusBar,
  Factory,
} from "native-base";
import React, { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useStyledSystemPropsResolver } from "native-base/src/hooks/useStyledSystemPropsResolver.ts";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedGestureHandler,
  BounceIn,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";

const Game = () => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(true);
  const { height, width } = useWindowDimensions();
  const speed = 15;
  const fps = 60;
  const delta = 1000 / fps;
  const ballWidth = 25;
  const islandDimensions = { x: 152.5, y: 11.17, w: 125, h: 36.9 };
  const hitBoxDimensions = {
    x: width / 4,
    y: height - 100,
    w: width / 2,
    h: 36.9,
  };
  const barColor = useColorModeValue("dark-content", "light-content");
  const bg = useColorModeValue("warmGray.50", "coolGray.800");
  const islandColor = useColorModeValue("coolGray.800", "warmGray.50");
  const targetPositionX = useSharedValue(width / 2);
  const targetPositionY = useSharedValue(height / 2);
  const playerPosition = useSharedValue({ x: width / 4, y: height - 100 });
  const AnimatedNbView = Factory(Animated.View);
  const AnimatedHitBox = Factory(Animated.View);

  //Ball Animated View
  const NBAnimatedView = ({
    height,
    width,
    aspectRatio,
    position,
    borderRadius,
    backgroundColor,
    children,
    animatedStyles,
  }) => {
    const ConverStyle = (StyleObject) => {
      const [style, ...restProp] = useStyledSystemPropsResolver(StyleObject);
      return { ...style, ...restProp[0].dataSet };
    };
    const resolvedProps = {
      h: ConverStyle(height),
      w: ConverStyle(width),
      bg: ConverStyle(backgroundColor),
      aspectRatio: ConverStyle(aspectRatio),
      position: ConverStyle(position),
      borderRadius: ConverStyle(borderRadius),
    };
    return (
      <AnimatedNbView
        style={[
          { ...resolvedProps.h },
          { ...resolvedProps.w },
          { ...resolvedProps.bg },
          { ...resolvedProps.aspectRatio },
          { ...resolvedProps.position },
          { ...resolvedProps.borderRadius },
          { justifyContent: "center" },
          animatedStyles,
        ]}
      >
        {children}
      </AnimatedNbView>
    );
  };

  // HitBox Animated View
  const NbAnimatedViewHitBox = ({
    height,
    width,
    position,
    top,
    left,
    borderRadius,
    backgroundColor,
    children,
    animatedStyles,
  }) => {
    const ConverStyle = (StyleObject) => {
      const [style, ...restProp] = useStyledSystemPropsResolver(StyleObject);
      return { ...style, ...restProp[0].dataSet };
    };
    const resolvedProps = {
      h: ConverStyle(height),
      w: ConverStyle(width),
      bg: ConverStyle(backgroundColor),
      position: ConverStyle(position),
      borderRadius: ConverStyle(borderRadius),
      top: ConverStyle(top),
      left: ConverStyle(left),
    };
    return (
      <AnimatedHitBox
        style={[
          { ...resolvedProps.h },
          { ...resolvedProps.w },
          { ...resolvedProps.bg },
          { ...resolvedProps.top },
          { ...resolvedProps.left },
          { ...resolvedProps.position },
          { ...resolvedProps.borderRadius },
          { justifyContent: "center" },
          animatedStyles,
        ]}
      >
        {children}
      </AnimatedHitBox>
    );
  };

  const normalizeVector = (vector) => {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
    };
  };
  const positionValue = useSharedValue(
    normalizeVector({ x: Math.random(), y: Math.random() })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        ballPositionChange();
      }
    }, delta);
    return () => clearInterval(interval);
  }, [gameOver]);

  //Animated Styles
  const ballPosition = useAnimatedStyle(() => {
    return {
      top: targetPositionY.value,
      left: targetPositionX.value,
    };
  });

  const hitBoxPosition = useAnimatedStyle(() => {
    return {
      left: playerPosition.value.x,
    };
  });

  const getPosition = (positionValue) => {
    return {
      x: targetPositionX.value + positionValue.x * speed,
      y: targetPositionY.value + positionValue.y * speed,
    };
  };

  const ballPositionChange = () => {
    let newPosition = getPosition(positionValue.value);
    let newDirection = positionValue.value;

    // Wall detection

    if (newPosition.y > height - ballWidth) {
      setGameOver(true);
    }

    if (newPosition.y < 0) {
      newDirection = {
        x: positionValue.value.x,
        y: -positionValue.value.y,
      };
    }
    if (newPosition.x < 0 || newPosition.x > width - ballWidth) {
      newDirection = {
        x: -positionValue.value.x,
        y: positionValue.value.y,
      };
    }
    positionValue.value = newDirection;
    newPosition = getPosition(newDirection);

    // 2d Collision detection (Island detection)
    if (
      newPosition.x < islandDimensions.x + islandDimensions.w &&
      newPosition.x + ballWidth > islandDimensions.x &&
      newPosition.y < islandDimensions.y + islandDimensions.h &&
      ballWidth + newPosition.y > islandDimensions.y
    ) {
      if (
        targetPositionX.value < islandDimensions.x ||
        targetPositionX.value > islandDimensions.x + islandDimensions.w
      ) {
        const newDirection = {
          x: -positionValue.value.x,
          y: positionValue.value.y,
        };
        positionValue.value = newDirection;
        newPosition = getPosition(newDirection);
      } else {
        const newDirection = {
          x: positionValue.value.x,
          y: -positionValue.value.y,
        };
        positionValue.value = newDirection;
        newPosition = getPosition(newDirection);
      }
      setScore((s) => s + 1);
    }
    // 2d Collision detection (HitBox detection)
    if (
      newPosition.x < playerPosition.value.x + hitBoxDimensions.w &&
      newPosition.x + ballWidth > playerPosition.value.x &&
      newPosition.y < playerPosition.value.y + hitBoxDimensions.h &&
      ballWidth + newPosition.y > playerPosition.value.y
    ) {
      if (
        targetPositionX.value < playerPosition.value.x ||
        targetPositionX.value > playerPosition.value.x + hitBoxDimensions.w
      ) {
        const newDirection = {
          x: -positionValue.value.x,
          y: positionValue.value.y,
        };
        positionValue.value = newDirection;
        newPosition = getPosition(newDirection);
      } else {
        const newDirection = {
          x: positionValue.value.x,
          y: -positionValue.value.y,
        };
        positionValue.value = newDirection;
        newPosition = getPosition(newDirection);
      }
    }

    (targetPositionX.value = withTiming(newPosition.x, {
      duration: delta,
      easing: Easing.linear,
    })),
      (targetPositionY.value = withTiming(newPosition.y, {
        duration: delta,
        easing: Easing.linear,
      }));
  };

  //Gesture Handler

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      playerPosition.value = {
        ...playerPosition.value,
        x: event.absoluteX - hitBoxDimensions.w / 2,
      };
    },
  });

  //Restart Game
  const restartGame = () => {
    targetPositionX.value = width / 2;
    targetPositionY.value = width / 2;
    setScore(0);
    setGameOver(false);
  };

  return (
    <>
      <StatusBar translucent backgroundColor={"black"} barStyle={barColor} />
      <Box>
        <Box h={"100%"} bg={bg} alignItems="center" justifyContent="center">
          <Text
            fontSize={100}
            fontWeight={500}
            position={"absolute"}
            top={150}
            color={islandColor}
          >
            {score}
          </Text>
          {gameOver && (
            <>
              <Button bg={islandColor} onPress={restartGame}>
                Start
              </Button>
              <Text
                fontSize={30}
                fontWeight={500}
                position={"absolute"}
                top={130}
                color={"red.700"}
              >
                Game Over
              </Text>
            </>
          )}

          {!gameOver && (
            <NBAnimatedView
              height={{ h: "25" }}
              width={{
                w: "25",
              }}
              backgroundColor={{
                bg: "red.500",
              }}
              aspectRatio={{
                aspectRatio: 1,
              }}
              position={{
                position: "absolute",
              }}
              borderRadius={{
                borderRadius: 20,
              }}
              animatedStyles={ballPosition}
            />
          )}

          {/*Island*/}
          <Animated.View
            entering={BounceIn}
            key={score}
            style={{
              position: "absolute",
              top: 11,
              width: islandDimensions.w,
              height: islandDimensions.h,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "black",
              borderRadius: 50,
            }}

            // h={islandDimensions.h}
            // w={islandDimensions.w}
            // top={islandDimensions.y}
            // left={islandDimensions.x}
            // // borderRadius={50}
            // bg={"black"}
            // position={"absolute"}
          />
        </Box>

        {/*HitBox*/}
        <NbAnimatedViewHitBox
          height={{
            h: hitBoxDimensions.h,
          }}
          width={{
            w: hitBoxDimensions.w,
          }}
          top={{
            top: playerPosition.value.y,
          }}
          left={{
            left: playerPosition.value.x,
          }}
          borderRadius={{
            borderRadius: 20,
          }}
          backgroundColor={{
            bg: islandColor,
          }}
          position={{
            position: "absolute",
          }}
          animatedStyles={hitBoxPosition}
        />
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            style={{
              width: "100%",
              height: 200,
              position: "absolute",
              bottom: 0,
            }}
          />
        </PanGestureHandler>
      </Box>
    </>
  );
};
export default Game;
