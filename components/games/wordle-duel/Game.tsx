"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "@/lib/games/registry";

const WORD = "CRANE";
const LIMIT = 60;
const MAX_GUESSES = 6;
const EMPTY = "";

type Guess = { word: string; by: string; correct: boolean };
type State = { guesses: Guess[]; startedAt: number };

export const initialWordleState = (roomId: string): State => ({
  guesses: [],
  startedAt: Date.now(),
});

const letters = "QWERTYUIOPASDFGHJKLZXCVBNM".split(EMPTY);

function scoreGuess(word: string) {
  return word.split(EMPTY).map((letter, i) =>
    letter === WORD[i] ? "correct" : WORD.includes(letter) ? "present" : "miss"
  );
}

export default function WordleDuel({ me, state, lastEvent, send, onFinish }: GameProps) {
  const initial = (state as State | null) ?? initialWordleState("");
  const [game, setGame] = useState<State>(initial);
  const [input, setInput] = useState(EMPTY);
  const [seconds, setSeconds] = useState(LIMIT);
  const [notice, setNotice] = useState("Find the word before your opponent.");

  useEffect(() => {
    if (!lastEvent?.data) return;
    const event = lastEvent.data as { type?: string; guess?: string };
    if (event.type !== "guess" || !event.guess) return;
    setGame((current) => ({
      ...current,
      guesses: [...current.guesses, { word: event.guess!, by: lastEvent.by, correct: event.guess === WORD }],
    }));
  }, [lastEvent]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setNotice("TIME. The word was CRANE.");
          onFinish("Rampage house", { [me]: 0 });
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [me, onFinish]);

  const myGuesses = useMemo(() => game.guesses.filter((guess) => guess.by === me), [game.guesses, me]);
  const opponentGuesses = game.guesses.filter((guess) => guess.by !== me);

  function submit() {
    const guess = input.trim().toUpperCase();
    if (guess.length !== 5 || myGuesses.length >= MAX_GUESSES || seconds === 0) {
      setNotice("Enter a five-letter word.");
      return;
    }
    const correct = guess === WORD;
    setGame((current) => ({ ...current, guesses: [...current.guesses, { word: guess, by: me, correct }] }));
    send({ type: "guess", guess });
    setInput(EMPTY);
    if (correct) {
      setNotice("Solved! You beat the clock.");
      onFinish(me, { [me]: 100, opponent: 0 });
    } else if (myGuesses.length + 1 >= MAX_GUESSES) {
      setNotice("Out of guesses. Keep watching your opponent.");
    }
  }

  const renderRows = (guesses: Guess[]) => [...Array(MAX_GUESSES)].map((_, row) => {
    const guess = guesses[row];
    const marks = guess ? scoreGuess(guess.word) : [];
    return (
      <div key={row} className="grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((column) => (
          <div key={column} className={`grid aspect-square place-items-center rounded-lg border-2 border-noir text-lg font-black ${marks[column] === "correct" ? "bg-acid" : marks[column] === "present" ? "bg-gold" : guess ? "bg-noir text-white" : "bg-white"}`}>
            {guess?.word[column] ?? ""}
          </div>
        ))}
      </div>
    );
  });

  return (
    <section className="mx-auto flex w-full max-w-[620px] flex-col gap-4 rounded-2xl border-4 border-noir bg-cream p-5 text-noir shadow-brut-lg">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-mono text-xs font-bold">RAMPAGE WORD DUEL</p><h1 className="font-display text-4xl uppercase">Beat the clock.</h1><p className="text-sm font-semibold">Same word. Six guesses. One minute.</p></div>
        <div className="rounded-xl border-3 border-noir bg-hot px-3 py-2 text-center font-display text-xl text-white">0:{String(seconds).padStart(2, "0")}</div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><div className="mb-2 flex justify-between font-mono text-xs font-bold"><span>YOU · {myGuesses.length}/6</span><span>{me}</span></div>{renderRows(myGuesses)}</div>
        <div><div className="mb-2 flex justify-between font-mono text-xs font-bold"><span>OPPONENT · {opponentGuesses.length}/6</span><span>HIDDEN</span></div>{renderRows(opponentGuesses)}</div>
      </div>
      <div className="flex gap-2"><input value={input} maxLength={5} onChange={(event) => setInput(event.target.value.replace(/[^a-z]/gi, EMPTY))} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="TYPE A WORD" className="min-w-0 flex-1 rounded-xl border-3 border-noir bg-white px-4 py-3 font-mono font-bold uppercase outline-none" /><button type="button" onClick={submit} className="rounded-xl border-3 border-noir bg-noir px-5 font-display text-acid">GUESS</button></div>
      <div className="flex flex-wrap gap-1.5">{letters.map((letter) => <span key={letter} className="grid h-7 w-6 place-items-center rounded border-2 border-noir bg-white font-mono text-[10px] font-bold">{letter}</span>)}</div>
      <p className="rounded-lg border-2 border-noir bg-acid px-3 py-2 text-center text-xs font-bold">{notice}</p>
    </section>
  );
}
