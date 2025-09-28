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
import { database as db, auth } from "../firebase";
import { ref, set, onValue, onDisconnect, update } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

const sampleTexts = [
  "But when a man suspects any wrong, it sometimes happens that if he be already involved in the matter, he insensibly strives to cover up his suspicions even from himself.",
  "Some enchanted evening, you may see a stranger. You may see a stranger across a crowded room, and somehow you know, you know even then, that somewhere you'll see her again and again.",
  "Keep in mind that many people have died for their beliefs; it's actually quite common. The real courage is in living and suffering for what you believe.",
];

const TypingRace = () => {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [countdown, setCountdown] = useState(null);

  const inputRef = useRef(null);
  const uid = useRef(uuidv4()).current;

  const randomizedText =
    sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

  // Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsub();
  }, []);

  // Push progress
  const pushProgress = (room, progress) => {
    const roomRef = ref(db, `rooms/${room}/players/${uid}`);
    set(roomRef, {
      name: playerName || `Player-${uid.slice(0, 5)}`,
      progress,
      finished: progress >= 100,
      ready: players[uid]?.ready || false, // preserve ready state
    });

    if (progress >= 100) {
      const roomMetaRef = ref(db, `rooms/${room}`);
      update(roomMetaRef, {
        status: "finished",
        winner: uid,
      });
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    const correctSoFar = text.slice(0, val.length);
    if (val === correctSoFar) {
      const newProgress = Math.min((val.length / text.length) * 100, 100);
      if (currentRoom) pushProgress(currentRoom, newProgress);
    }
  };

  const handleRestart = () => {
    setUserInput("");
    if (currentRoom) pushProgress(currentRoom, 0);
    inputRef.current?.focus();
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
    if (!id) return;
    setCurrentRoom(id);
    const playerRef = ref(db, `rooms/${id}/players/${uid}`);
    set(playerRef, {
      name: playerName || `Player-${uid.slice(0, 5)}`,
      progress: 0,
      finished: false,
      ready: false,
    });
    onDisconnect(playerRef).remove();
  };

  // Mark the player as ready
  const markReady = () => {
    if (!currentRoom) return;
    const playerRef = ref(db, `rooms/${currentRoom}/players/${uid}`);
    update(playerRef, { ready: true });
  };

  // Listen to room updates
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
      setCountdown(data.countdown || null); // ✅ sync countdown from Firebase
    });
    return () => unsubscribe();
  }, [currentRoom]);

  useEffect(() => {
    setText(randomizedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    if (Object.keys(players).length > 1) {
      // ✅ require at least 2 players
      const allReady = Object.values(players).every((p) => p.ready);
      if (allReady && status === "waiting") {
        // start countdown when all are ready and waiting
        const roomRef = ref(db, `rooms/${currentRoom}`);
        update(roomRef, { status: "countdown", countdown: 3 });

        let cd = 3;
        const interval = setInterval(() => {
          cd -= 1;
          if (cd > 0) {
            update(roomRef, { countdown: cd });
          } else {
            update(roomRef, { status: "running", countdown: null });
            clearInterval(interval);
          }
        }, 1000);
      }
    }
  }, [currentRoom, players, status]);

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
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
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
        userSelect="none" // ✅ disable text selection
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
        disabled={status !== "running"}
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
            <Text>
              {p.name} {p.ready && status === "waiting" ? "✅ Ready" : ""}
            </Text>
            <Progress value={p.progress} colorScheme="teal" />
          </Box>
        ))}
      </VStack>

      <HStack>
        {status === "waiting" &&
          currentRoom &&
          !players[uid]?.ready && ( // ✅ hide ready button once clicked
            <Button onClick={markReady} colorScheme="blue" mt={2}>
              I'm Ready
            </Button>
          )}

        {status === "countdown" && (
          <Text fontSize="2xl" fontWeight="bold" color="orange.500">
            Starting in: {countdown}
          </Text>
        )}

        <Button onClick={handleRestart} mt={2}>
          Reset My Input
        </Button>
      </HStack>
    </VStack>
  );
};

export default TypingRace;
