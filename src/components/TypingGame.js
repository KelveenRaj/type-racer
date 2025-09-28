import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  HStack,
  Progress,
} from "@chakra-ui/react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  update,
} from "firebase/database";
import { v4 as uuidv4 } from "uuid";

// ✅ Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const sampleTexts = [
  "But when a man suspects any wrong, it sometimes happens that if he be already involved in the matter, he insensibly strives to cover up his suspicions even from himself.",
  "Some enchanted evening, you may see a stranger. You may see a stranger across a crowded room, and somehow you know, you know even then, that somewhere you'll see her again and again.",
  "Keep in mind that many people have died for their beliefs; it's actually quite common. The real courage is in living and suffering for what you believe.",
];

const TypingRace = ({ playerName }) => {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);
  const inputRef = useRef(null);
  const uid = useRef(uuidv4()).current;

  const randomizedText =
    sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

  // Push progress to Firebase
  const pushProgress = (room, progress) => {
    const roomRef = ref(db, `rooms/${room}/players/${uid}`);
    set(roomRef, {
      name: playerName || `Player-${uid.slice(0, 5)}`,
      progress,
      finished: progress >= 100,
    });

    if (progress >= 100) {
      const roomMetaRef = ref(db, `rooms/${room}`);
      update(roomMetaRef, {
        status: "finished",
        winner: uid,
      });
    }
  };

  // Handle typing
  const handleChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    const correctSoFar = text.slice(0, val.length);
    let newProgress = 0;
    if (val === correctSoFar) {
      newProgress = Math.min((val.length / text.length) * 100, 100);
      setProgress(newProgress);
      if (currentRoom) pushProgress(currentRoom, newProgress);
    }
  };

  const handleRestart = () => {
    setUserInput("");
    setProgress(0);
    if (currentRoom) pushProgress(currentRoom, 0);
    inputRef.current.focus();
  };

  const createRoom = () => {
    const id = uuidv4().slice(0, 6).toUpperCase();
    setCurrentRoom(id);
    set(ref(db, `rooms/${id}`), {
      text: randomizedText,
      status: "waiting",
      players: {},
      winner: null,
    });
    joinRoom(id);
  };

  const joinRoom = (id) => {
    setCurrentRoom(id);
    const playerRef = ref(db, `rooms/${id}/players/${uid}`);
    set(playerRef, {
      name: playerName || `Player-${uid.slice(0, 5)}`,
      progress: 0,
      finished: false,
    });
    onDisconnect(playerRef).remove();
  };

  useEffect(() => {
    if (!currentRoom) return;
    const roomRef = ref(db, `rooms/${currentRoom}`);
    const unsubscribe = onValue(roomRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      setText(data.text);
      setStatus(data.status);
      setWinner(data.winner || null);
      setPlayers(data.players || {});
    });
    return () => unsubscribe();
  }, [currentRoom]);

  useEffect(() => {
    setText(randomizedText);
  }, []);

  return (
    <VStack
      spacing={4}
      border="1px solid"
      borderColor="gray.200"
      p={4}
      borderRadius="md"
    >
      <Heading size="md">Realtime Typing Race</Heading>

      <Text fontSize="sm" color="gray.600">
        {currentRoom
          ? `In Room: ${currentRoom} | Players: ${Object.keys(players).length}`
          : "Not in a room"}
      </Text>

      <HStack w="100%">
        <Input
          placeholder="Room ID (or leave blank to create)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
        <Button onClick={createRoom}>Create</Button>
        <Button onClick={() => joinRoom(roomId)} colorScheme="teal">
          Join
        </Button>
      </HStack>

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
          let color = "gray.700";
          if (index < userInput.length) {
            if (userInput[index] === char) {
              color = "green.500";
            } else {
              color = "red.500";
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
        disabled={status === "finished"}
      />

      <Text>
        Room: {currentRoom || "—"} | Status: {status} | Players:{" "}
        {Object.keys(players).length}
      </Text>

      {status === "finished" && winner && (
        <Text color="teal.600" fontWeight="bold">
          Winner: {players[winner]?.name || "Unknown"}
        </Text>
      )}

      <VStack w="100%" align="stretch">
        {Object.entries(players).map(([id, p]) => (
          <Box key={id}>
            <Text>{p.name}</Text>
            <Progress value={p.progress} colorScheme="teal" />
          </Box>
        ))}
      </VStack>

      <Button onClick={handleRestart} mt={2}>
        Reset My Input
      </Button>
    </VStack>
  );
};

export default TypingRace;
