import { GameUser } from "@/util/types/GameUser";
import { StateManager } from "@/util/types/StateManager";
import React, { useRef } from "react";

interface UserLoginProps {
  userState: StateManager<GameUser | null>;
}

export default function UserLogin({ userState }: UserLoginProps) {
  const usernameInput = useRef<HTMLInputElement | null>(null);

  return (
    <div className="user_input w-full h-[30%] flex flex-col gap-4 items-center justify-start">
      <input
        className="bg-white/10 p-2 rounded-lg text-xl focus:outline-none placeholder:text-white/20 invalid:ring-2 invalid:ring-red-700/50 valid:ring-2 valid:ring-green-700/50"
        type="text"
        maxLength={32}
        minLength={3}
        placeholder="Enter username here"
        data-username=""
        onChange={(e) => {
          e.target.dataset.query = e.target.value;
        }}
        ref={usernameInput}
      ></input>
      <button
        className="username_confirmation_button bg-green-700/90 rounded-lg p-2 text-lg hover:cursor-pointer focus:ring-2 focus:ring-green-700/50"
        onClick={() => {
          const newUser: GameUser = {
            id: usernameInput.current?.dataset.query || "",
            icon: 0,
          };

          userState.set(newUser);
        }}
      >
        Done
      </button>
    </div>
  );
}
