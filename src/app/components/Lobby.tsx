import { GameRoom } from "@/util/types/GameRoom";
import { GameUser } from "@/util/types/GameUser";
import { StateManager } from "@/util/types/StateManager";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import { db } from "../firebase/firebase";

const hugeThesaurusKey = "06f4be11394a385ca4b42b29cee13b48";

interface LobbyProps {
  userState: StateManager<GameUser | null>;
  roomState: StateManager<GameRoom | null>;
}

interface Words {
  civilians: string;
  undercover: string;
}

interface RoleAssignments {
  [playerId: string]: "Mr. White" | "Undercover" | "Civilian";
}

export default function Lobby({ userState, roomState }: LobbyProps) {
  const mrWhiteInput = useRef<HTMLInputElement | null>(null);
  const undercoverInput = useRef<HTMLInputElement | null>(null);
  const [startableGame, setStartableGame] = useState<boolean | null>(null);

  return (
    <div className="w-full h-[60%] flex flex-col gap-4 items-center justify-start">
      <span>Room id: {roomState.get!.id}</span>
      <span>
        Current players: {roomState.get!.players.map((p) => p.id).join(",")}
      </span>
      <span>Creator: {roomState.get!.creator}</span>
      <span>Phase: {roomState.get!.phase === 1 ? "lobby" : "game"}</span>
      {userState.get!.id == roomState.get!.creator &&
        roomState.get!.phase === 1 && (
          <>
            <span className="flex justify-center items-center gap-4 w-[33%] h-[15%]">
              <label>Mr. Whites</label>
              <input
                className="bg-white/10 w-[20%] text-white box-border focus:outline-none indent-1"
                type="number"
                ref={mrWhiteInput}
                min={1}
                max={
                  roomState.get!.players.length / 2 === 0
                    ? 1
                    : roomState.get!.players.length / 2
                }
              />
            </span>
            <span className="flex justify-center items-center gap-4 w-[33%] h-[15%]">
              <label>Undercovers</label>
              <input
                className="bg-white/10 w-[20%] text-white box-border focus:outline-none indent-1"
                type="number"
                ref={undercoverInput}
                min={1}
                max={
                  roomState.get!.players.length / 2 === 0
                    ? 1
                    : roomState.get!.players.length / 2
                }
              />
            </span>
            <button
              className="start_game_button bg-green-700/90 rounded-lg p-2 text-lg hover:cursor-pointer focus:ring-2 focus:ring-green-700/50"
              onClick={async () => {
                if (!mrWhiteInput.current && !undercoverInput.current) return;

                setStartableGame(
                  mrWhiteInput.current!.valueAsNumber +
                    undercoverInput.current!.valueAsNumber <=
                    roomState.get!.players.length / 2
                );

                if (startableGame) {
                  const docSnap = await getDoc(
                    doc(db, "rooms", roomState.get!.id)
                  );

                  //fetch words: done
                  const fetchedWords = await fetchWords();

                  //assign roles: done
                  const roles = assignRoles(
                    roomState.get!.players.map((p) => p.id),
                    mrWhiteInput.current!.valueAsNumber,
                    undercoverInput.current!.valueAsNumber
                  );

                  await updateDoc(docSnap.ref, {
                    phase: 2,
                    words: fetchedWords,
                    roles: roles,
                    currentTurn: 0,
                  });
                }
              }}
            >
              Start
            </button>

            {startableGame === false && (
              <span className="text-xl text-red-600">Cannot start game</span>
            )}
          </>
        )}
    </div>
  );
}

const fetchWords = async (): Promise<Words | null> => {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const word = await fetchRandomWord();
    if (!word) {
      attempts++;
      continue;
    }

    const synonym = await getSynonym(word);
    if (!synonym) {
      attempts++;
      continue;
    }

    return {
      civilians: word,
      undercover: synonym,
    };
  }

  console.error("Failed to fetch valid word and synonym after max attempts.");
  return null;
};

const fetchRandomWord = async (): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://random-word-api.herokuapp.com/word?length=${Math.floor(
        Math.random() * 7 + 3
      )}`
    );

    if (!res.ok) return null;

    const words = await res.json();
    return words[0] || null;
  } catch (error) {
    console.error("Error fetching random word:", error);
    return null;
  }
};

const getSynonym = async (word: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://words.bighugelabs.com/api/2/${hugeThesaurusKey}/${word}/json`
    );

    if (!res.ok) return null;

    const syn = await res.json();
    const wordType = Object.keys(syn)[0];
    const synonyms = syn[wordType]?.syn;

    return synonyms?.[0] || null;
  } catch (error) {
    console.error(`Error fetching synonym for "${word}":`, error);
    return null;
  }
};

export const assignRoles = (
  players: string[],
  mrWhites: number,
  undercovers: number
): RoleAssignments => {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const assignments: RoleAssignments = {};

  shuffled.forEach((player, index) => {
    if (index < mrWhites) {
      assignments[player] = "Mr. White";
    } else if (index < mrWhites + undercovers) {
      assignments[player] = "Undercover";
    } else {
      assignments[player] = "Civilian";
    }
  });

  return assignments;
};
