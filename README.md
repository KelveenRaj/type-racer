# Type Racer

Real-time multiplayer typing races. Join a room, wait for the countdown, and race other players to type the same sentence. Fastest and most accurate typist wins.

## How it works

- Players sign in anonymously and join a room by ID
- Everyone gets the same randomly generated sentence
- Each round runs on a 60 second timer
- Progress, WPM and accuracy sync live through Firebase Realtime Database
- The winner is the highest WPM, with accuracy as the tiebreaker
- Stale rooms are cleaned up automatically

## Built with

React 19, Chakra UI, Framer Motion, Firebase (Realtime Database + Anonymous Auth)

## Run it locally

```bash
npm install
npm start
```

You'll need your own Firebase project. Put its config in `src/firebase.js` and enable Anonymous sign-in plus the Realtime Database.
