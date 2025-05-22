import { GameRoom } from "@/util/types/GameRoom";
import { GameUser } from "@/util/types/GameUser";
import { StateManager } from "@/util/types/StateManager";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import Lobby from "./Lobby";

interface RoomProps {
  userState: StateManager<GameUser | null>;
  roomState: StateManager<GameRoom | null>;
}

export default function Room({ userState, roomState }: RoomProps) {
  const [remainingTime, setRemainingTime] = useState(60);

  useEffect(() => {
    const roomId = roomState.get?.id;
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        roomState.set(docSnap.data() as GameRoom);
      } else {
        console.log("Room no longer exists");
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState.get?.id]); // fucking hell eslint how do i fix this i should've used zustand i hate myself

  useEffect(() => {
    const room = roomState.get;
    if (!room) return;

    const timeInterval = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime === 0) {
          clearInterval(timeInterval);

          getDoc(doc(db, "rooms", room.id)).then(async (docSnap) => {
            if (!docSnap.exists()) return;

            const currentIndex = room.currentTurn!;
            const players = room.players;
            const nextPlayer = players[currentIndex + 1];

            if (nextPlayer) {
              await updateDoc(docSnap.ref, {
                currentTurn: nextPlayer.id,
              });
            }
          });

          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [roomState.get]);

  // useEffect(() => {
  //   const currentPhase = roomState.get?.phase;
  //   if (!currentPhase) return;
  // }, [roomState.get?.phase]);

  if (userState.get && roomState.get) {
    return (
      <>
        {roomState.get.phase === 1 && (
          <Lobby userState={userState} roomState={roomState} />
        )}

        {roomState.get.phase === 2 && (
          <div className="w-full h-[60%] flex flex-col gap-4 items-center justify-start">
            <h1>You are: {roomState.get.roles![userState.get.id]}</h1>
            <h1>
              You word is:{" "}
              {roomState.get.roles![userState.get.id] === "Civilian"
                ? roomState.get.words!.civilians
                : roomState.get.roles![userState.get.id] === "Mr. White"
                ? "NONE"
                : roomState.get.words!.undercover}
            </h1>
            <h1>
              {roomState.get.currentTurn! ===
                roomState.get.players.findIndex(
                  (u) => u.id === userState.get!.id
                ) && "It's your turn"}
            </h1>
            {roomState.get.currentTurn ===
              roomState.get.players.findIndex(
                (u) => u.id === userState.get!.id
              ) && <h1>Remaining time: {remainingTime}</h1>}
          </div>
        )}
      </>
    );
  } else {
    return <div>Something went wrong</div>;
  }
}
