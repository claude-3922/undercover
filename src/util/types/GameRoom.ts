import { GameUser } from "./GameUser";

export interface GameRoom {
  id: string;
  phase: number; //0: Spectator, 1: Lobby, 2: Description, 3: Discussion, 4: Voting
  players: GameUser[];
  creator: string;

  words?: {
    civilians: string;
    undercover: string;
  };
  roles?: {
    [playerId: string]: "Mr. White" | "Undercover" | "Civilian";
  };
  currentTurn?: number;
  descriptions?: {
    [playerId: string]: string;
  };

  votes?: {
    [playerId: string]: string;
  };
}
