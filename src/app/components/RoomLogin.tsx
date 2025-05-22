import React, { useRef } from "react";
import UserLogin from "./UserLogin";
import { StateManager } from "@/util/types/StateManager";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { GameUser } from "@/util/types/GameUser";
import { GameRoom } from "@/util/types/GameRoom";
import { guid } from "@/util/guid";

interface RoomLoginProps {
  userState: StateManager<GameUser | null>;
  roomState: StateManager<GameRoom | null>;
}

export default function RoomLogin({ userState, roomState }: RoomLoginProps) {
  const roomInput = useRef<HTMLInputElement | null>(null);

  return (
    <>
      {userState.get ? (
        <>
          <div className="menu_buttons w-full h-[30%] flex flex-col gap-4 items-center justify-start">
            <span className="flex justify-center items-center gap-1">
              <input
                className="bg-white/10 p-2 rounded-lg text-xl focus:ring-2 focus:ring-white/50 focus:outline-none placeholder:text-white/20"
                type="text"
                placeholder="Join an existing room"
                data-roomid=""
                onChange={(e) => {
                  e.target.dataset.roomid = e.target.value;
                }}
                ref={roomInput}
              ></input>
              <button
                className="join_button bg-green-700/90 rounded-lg p-2 text-lg hover:cursor-pointer focus:ring-2 focus:ring-green-700/50"
                onClick={async () => {
                  const input = roomInput.current?.dataset.roomid;
                  if (!input) return console.log("Invalid input...");
                  try {
                    const q = query(
                      collection(db, "rooms"),
                      where("id", "==", input)
                    );
                    const querySnapshot = await getDocs(q);
                    if (querySnapshot.size === 1) {
                      const roomDoc = querySnapshot.docs[0];

                      const players: GameUser[] =
                        querySnapshot.docs[0].data().players;
                      players.push(userState.get!);

                      await updateDoc(roomDoc.ref, {
                        players: players,
                      });

                      roomState.set({
                        id: roomDoc.data().id,
                        phase: roomDoc.data().phase,
                        players: players,
                        creator: roomDoc.data().creator,
                      });
                    } else {
                      if (!roomInput.current) return;
                      roomInput.current.value = "";
                      roomInput.current.placeholder = "Something went wrong";
                    }
                  } catch (e) {
                    console.error("Error adding document: ", e);
                  }
                }}
              >
                Join
              </button>
            </span>
            <button
              className="create_button bg-green-700/90 rounded-lg p-2 text-lg hover:cursor-pointer focus:ring-2 focus:ring-green-700/50"
              onClick={async () => {
                try {
                  const generatedId = guid();
                  const newRoom: GameRoom = {
                    id: generatedId,
                    phase: 1,
                    players: [userState.get!],
                    creator: userState.get!.id,
                  };
                  const docRef = doc(db, "rooms", generatedId);
                  await setDoc(docRef, newRoom);
                  roomState.set(newRoom);
                  console.log(`Room created => ${newRoom.id}`);
                } catch (e) {
                  console.error("Error adding document: ", e);
                }
              }}
            >
              Create a room
            </button>
          </div>
        </>
      ) : (
        <UserLogin userState={userState} />
      )}
    </>
  );
}
