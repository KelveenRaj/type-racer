import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Input, Text, VStack, Heading } from "@chakra-ui/react";

const sampleTexts = [
  "But when a man suspects any wrong, it sometimes happens that if he be already involved in the matter, he insensibly strives to cover up his suspicions even from himself.",
  "Some enchanted evening, you may see a stranger. You may see a stranger across a crowded room, and somehow you know, you know even then, that somewhere you'll see her again and again. Some enchanted evening, someone may be laughing. You may hear her laughing across a crowded room, and night after night, as strange as it seems, the sound of her laughter will sing in your dreams.",
  "Keep in mind that many people have died for their beliefs; it's actually quite common. The real courage is in living and suffering for what you believe.",
];

const TypingGame = ({ playerName }) => {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const inputRef = useRef(null);

  const randomizedText =
    sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

  const handleChange = (e) => {
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());
    setUserInput(val);

    if (val === text) {
      const timeTaken = (Date.now() - startTime) / 1000 / 60;
      const words = text.split(" ").length;
      const wpmCalc = Math.round(words / timeTaken);
      setWpm(wpmCalc);
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setText(randomizedText);
    setUserInput("");
    setStartTime(null);
    setIsFinished(false);
    setWpm(0);
    inputRef.current.focus();
  };

  useEffect(() => {
    setText(randomizedText);
  }, []);

  return (
    <VStack spacing={4} p={4} border="1px solid gray" borderRadius="md">
      <Heading size="md">Typing Game</Heading>

      <Box
        p={3}
        border="1px solid lightgray"
        borderRadius="md"
        bg="gray.50"
        fontFamily="monospace"
        fontSize="lg"
        minH="100px"
        w="100%"
      >
        {text.split("").map((char, index) => {
          let color = "gray.700"; // default color
          if (index < userInput.length) {
            if (userInput[index] === char) {
              color = "green.500"; // correct char
            } else {
              color = "red.500"; // wrong char
            }
          }
          return (
            <Text as="span" key={index} color={color}>
              {char}
            </Text>
          );
        })}
      </Box>

      <Input
        ref={inputRef}
        value={userInput}
        onChange={handleChange}
        placeholder="Start typing..."
        disabled={isFinished}
      />

      {isFinished && (
        <Box>
          <Text fontSize="lg">WPM: {wpm}</Text>
          <Button mt={2} onClick={handleRestart} colorScheme="teal">
            Restart
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default TypingGame;
