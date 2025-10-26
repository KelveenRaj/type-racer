import React, { useEffect, useRef, useState } from "react";
import { useRoomCleanup } from "../hooks/useRoomCleanup";
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
import { useGenerateSentence } from "../hooks/useGenerateSentence";

const TypingRace = () => {
  const [startTime, setStartTime] = useState(null);
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [gameTimeLeft, setGameTimeLeft] = useState(60); // 120s timer
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const uid = useRef(uuidv4()).current;

  const generateSentence = useGenerateSentence();
  useRoomCleanup();

  // Game timer effect & start time
  useEffect(() => {
    if (status === "running") {
      setGameTimeLeft(60);
      setStartTime(Date.now());
      timerRef.current = setInterval(() => {
        setGameTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // End game if timer runs out
            if (currentRoom) {
              const roomRef = ref(db, `rooms/${currentRoom}`);
              update(roomRef, { status: "finished", timerExpired: true });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, currentRoom]);

  // Calculate winner when game ends (timer or all finished)
  useEffect(() => {
    if (!currentRoom) return;
    if (status === "finished") {
      let winnerId = null;
      let bestScore = -1;
      let bestAccuracy = -1;
      Object.entries(players).forEach(([id, p]) => {
        if (p.wpm && p.accuracy) {
          if (
            p.wpm > bestScore ||
            (p.wpm === bestScore && p.accuracy > bestAccuracy)
          ) {
            bestScore = p.wpm;
            bestAccuracy = p.accuracy;
            winnerId = id;
          }
        }
      });
      if (winner !== winnerId) {
        const roomRef = ref(db, `rooms/${currentRoom}`);
        update(roomRef, { winner: winnerId, endedAt: Date.now() });
      }
    }
  }, [status, players, currentRoom, winner]);

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
    let stats = {
      name: playerName || `Player-${uid.slice(0, 5)}`,
      progress,
      finished: progress >= 100,
      ready: players[uid]?.ready || false, // preserve ready state
    };
    if (progress >= 100 && startTime) {
      const finishTime = Date.now();
      const timeTaken = (finishTime - startTime) / 1000; // seconds
      const wordsTyped = userInput.trim().split(/\s+/).length;
      const wpm = Math.round((wordsTyped / timeTaken) * 60);
      // Accuracy: correct chars / total chars
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === text[i]) correctChars++;
      }
      const accuracy = text.length
        ? Math.round((correctChars / text.length) * 100)
        : 0;
      stats = {
        ...stats,
        finishTime,
        timeTaken,
        wpm,
        accuracy,
      };
    }
    set(roomRef, stats);
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
      text: generateSentence(),
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
    setText(generateSentence());
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
      // End game if all players finished (progress 100%)
      const allFinished =
        Object.values(players).length > 1 &&
        Object.values(players).every((p) => p.progress === 100);
      if (status === "running" && allFinished) {
        const roomRef = ref(db, `rooms/${currentRoom}`);
        update(roomRef, { status: "finished", finishedEarly: true });
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
      {status === "running" && (
        <Text fontSize="lg" color="red.500" fontWeight="bold">
          Time Left: {gameTimeLeft}s
        </Text>
      )}

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

      {status === "finished" && (
        <Box>
          <Text color="teal.600" fontWeight="bold">
            {winner
              ? `🏆 Winner: ${players[winner]?.name || "Unknown"} (WPM: ${
                  players[winner]?.wpm || 0
                }, Accuracy: ${players[winner]?.accuracy || 0}%)`
              : "No winner"}
          </Text>
          <VStack align="start" mt={2}>
            {Object.entries(players).map(([id, p]) => (
              <Text key={id}>
                {p.name}:{" "}
                {p.finished
                  ? `WPM: ${p.wpm || 0}, Accuracy: ${p.accuracy || 0}%`
                  : "Not finished"}
              </Text>
            ))}
          </VStack>
        </Box>
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
