"use client";
import useStateManager from "./hooks/StateManager";
import RoomLogin from "./components/RoomLogin";
import Room from "./components/Room";
import { GameUser } from "@/util/types/GameUser";
import { GameRoom } from "@/util/types/GameRoom";

export default function Home() {
  const userState = useStateManager<GameUser | null>(null);
  const roomState = useStateManager<GameRoom | null>(null);

  return (
    <>
      <div className="title w-full h-[20%] flex items-center justify-center text-6xl">
        UNDERCOVER
      </div>

      {roomState.get ? (
        <Room roomState={roomState} userState={userState} />
      ) : (
        <RoomLogin roomState={roomState} userState={userState} />
      )}
    </>
  );
}
