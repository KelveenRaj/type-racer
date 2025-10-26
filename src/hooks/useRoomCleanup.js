import { useEffect } from "react";
import { database as db } from "../firebase";
import { ref, onValue } from "firebase/database";

export const useRoomCleanup = () => {
  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    const unsubscribe = onValue(roomsRef, (snap) => {
      if (!snap.exists()) return;
      const now = Date.now();
      const rooms = snap.val();
      Object.entries(rooms).forEach(([roomId, roomData]) => {
        if (roomData.endedAt && now - roomData.endedAt > 10 * 60 * 1000) {
          import("firebase/database").then(({ remove }) =>
            remove(ref(db, `rooms/${roomId}`))
          );
        }
      });
    });
    return () => unsubscribe();
  }, []);
};
