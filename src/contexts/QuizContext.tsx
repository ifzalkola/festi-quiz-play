import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { database } from '@/lib/firebase';
import { 
  ref, 
  onValue, 
  set, 
  update, 
  push, 
  remove,
  get
} from 'firebase/database';

// Firebase data types
interface FirebaseRoom {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  maxPlayers: number;
  questions: Question[];
  isPublished: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  currentQuestionIndex: number;
  createdAt: string;
}

interface FirebasePlayer {
  id: string;
  name: string;
  roomId: string;
  score: number;
  isReady: boolean;
  isOnline: boolean;
  joinedAt: string;
  userId: string;
}

// Types
export type QuestionType = 'true-false' | 'multiple-choice' | 'text-input';
export type ScoringMode = 'time-based' | 'order-based' | 'first-only';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  imageUrl?: string;
}

export interface QuizRoom {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  maxPlayers: number;
  questions: Question[];
  isPublished: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  currentQuestionIndex: number;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  roomId: string;
  score: number;
  isReady: boolean;
  isOnline: boolean;
  joinedAt: Date;
}

export interface CurrentQuestion {
  question: Question;
  basePoints: number;
  scoringMode: ScoringMode;
  timeLimit: number;
  startedAt: Date;
}

export interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
  timeTaken: number;
  isCorrect: boolean;
  pointsEarned: number;
}

interface QuizContextType {
  // Room state
  currentRoom: QuizRoom | null;
  players: Player[];
  currentQuestion: CurrentQuestion | null;
  answers: Answer[];
  currentUserId: string | null;
  
  // Actions
  createRoom: (name: string, ownerName: string, maxPlayers: number) => Promise<string>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  addQuestion: (roomId: string, question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (roomId: string, questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (roomId: string, questionId: string) => Promise<void>;
  publishRoom: (roomId: string) => Promise<void>;
  startQuiz: (roomId: string) => Promise<void>;
  publishQuestion: (roomId: string, questionIndex: number, basePoints: number, scoringMode: ScoringMode, timeLimit: number) => Promise<void>;
  submitAnswer: (playerId: string, answer: string) => Promise<void>;
  setPlayerReady: (playerId: string, isReady: boolean) => Promise<void>;
  nextQuestion: (roomId: string) => Promise<void>;
  endQuiz: (roomId: string) => Promise<void>;
  leaveRoom: (playerId: string) => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider');
  }
  return context;
};

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoom, setCurrentRoom] = useState<QuizRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Generate a unique user ID on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('quiz_user_id');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('quiz_user_id', newUserId);
      setCurrentUserId(newUserId);
    }
  }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async (name: string, ownerName: string, maxPlayers: number): Promise<string> => {
    if (!currentUserId) throw new Error('User ID not initialized');
    
    const roomRef = push(ref(database, 'rooms'));
    const roomId = roomRef.key!;
    
    const newRoom = {
      id: roomId,
      name,
      code: generateRoomCode(),
      ownerId: currentUserId,
      ownerName,
      maxPlayers,
      questions: [],
      isPublished: false,
      isStarted: false,
      isCompleted: false,
      currentQuestionIndex: -1,
      createdAt: new Date().toISOString()
    };
    
    await set(roomRef, newRoom);
    return roomId;
  };

  const joinRoom = async (code: string, playerName: string): Promise<void> => {
    if (!currentUserId) throw new Error('User ID not initialized');
    
    // Find room by code
    const roomsRef = ref(database, 'rooms');
    const snapshot = await get(roomsRef);
    
    let foundRoom: FirebaseRoom | null = null;
    let foundRoomId: string | null = null;
    
    if (snapshot.exists()) {
      const rooms = snapshot.val() as Record<string, FirebaseRoom>;
      for (const [roomId, room] of Object.entries(rooms)) {
        if (room.code === code) {
          foundRoom = room;
          foundRoomId = roomId;
          break;
        }
      }
    }
    
    if (!foundRoom || !foundRoomId) throw new Error('Room not found');
    if (!foundRoom.isPublished) throw new Error('Room not published yet');
    if (foundRoom.isStarted) throw new Error('Quiz already started');
    
    // Check player count
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    let currentPlayerCount = 0;
    
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      currentPlayerCount = Object.values(allPlayers).filter(
        (p) => p.roomId === foundRoomId && p.isOnline
      ).length;
    }
    
    if (currentPlayerCount >= foundRoom.maxPlayers) {
      throw new Error('Room is full');
    }
    
    // Create player
    const playerRef = push(ref(database, 'players'));
    const playerId = playerRef.key!;
    
    const newPlayer = {
      id: playerId,
      name: playerName,
      roomId: foundRoomId,
      score: 0,
      isReady: false,
      isOnline: true,
      joinedAt: new Date().toISOString(),
      userId: currentUserId
    };
    
    await set(playerRef, newPlayer);
    
    // Store player ID in localStorage
    localStorage.setItem('current_player_id', playerId);
    localStorage.setItem('current_room_id', foundRoomId);
  };

  const addQuestion = async (roomId: string, question: Omit<Question, 'id'>): Promise<void> => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const questions = room.questions || [];
    
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    questions.push(newQuestion);
    await update(roomRef, { questions });
  };

  const updateQuestion = async (roomId: string, questionId: string, updates: Partial<Question>): Promise<void> => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const questions = room.questions || [];
    const questionIndex = questions.findIndex((q: Question) => q.id === questionId);
    
    if (questionIndex === -1) throw new Error('Question not found');
    
    questions[questionIndex] = { ...questions[questionIndex], ...updates };
    await update(roomRef, { questions });
  };

  const deleteQuestion = async (roomId: string, questionId: string): Promise<void> => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const questions = (room.questions || []).filter((q: Question) => q.id !== questionId);
    await update(roomRef, { questions });
  };

  const publishRoom = async (roomId: string): Promise<void> => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    if (!room.questions || room.questions.length === 0) {
      throw new Error('Add at least one question');
    }
    
    await update(roomRef, { isPublished: true });
  };

  const startQuiz = async (roomId: string): Promise<void> => {
    await update(ref(database, `rooms/${roomId}`), { isStarted: true });
  };

  const publishQuestion = async (
    roomId: string,
    questionIndex: number,
    basePoints: number,
    scoringMode: ScoringMode,
    timeLimit: number
  ): Promise<void> => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const question = room.questions[questionIndex];
    
    if (!question) throw new Error('Question not found');
    
    await update(roomRef, { currentQuestionIndex: questionIndex });
    
    // Set current question in Firebase
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await set(currentQuestionRef, {
      question,
      basePoints,
      scoringMode,
      timeLimit,
      startedAt: new Date().toISOString()
    });
    
    // Clear previous answers
    const answersRef = ref(database, `answers/${roomId}`);
    await remove(answersRef);
  };

  const submitAnswer = async (playerId: string, answer: string): Promise<void> => {
    if (!currentQuestion || !currentRoom) throw new Error('No active question');
    
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) throw new Error('Players not found');
    
    const allPlayers = snapshot.val() as Record<string, FirebasePlayer>;
    let player: FirebasePlayer | null = null;
    
    for (const [, p] of Object.entries(allPlayers)) {
      if (p.id === playerId) {
        player = p;
        break;
      }
    }
    
    if (!player) throw new Error('Player not found');
    
    const timeTaken = (Date.now() - new Date(currentQuestion.startedAt).getTime()) / 1000;
    const isCorrect = Array.isArray(currentQuestion.question.correctAnswer)
      ? currentQuestion.question.correctAnswer.includes(answer)
      : currentQuestion.question.correctAnswer === answer;
    
    // Get current answers count
    const answersRef = ref(database, `answers/${currentRoom.id}`);
    const answersSnapshot = await get(answersRef);
    const currentAnswers = answersSnapshot.exists() ? Object.values(answersSnapshot.val() as Record<string, Answer>) : [];
    const correctAnswersCount = currentAnswers.filter((a) => a.isCorrect).length;
    
    let pointsEarned = 0;
    if (isCorrect) {
      switch (currentQuestion.scoringMode) {
        case 'time-based':
          pointsEarned = Math.max(0, currentQuestion.basePoints - Math.floor(timeTaken));
          break;
        case 'order-based':
          if (correctAnswersCount === 0) pointsEarned = currentQuestion.basePoints;
          else if (correctAnswersCount === 1) pointsEarned = Math.floor(currentQuestion.basePoints * 0.7);
          else if (correctAnswersCount === 2) pointsEarned = Math.floor(currentQuestion.basePoints * 0.4);
          break;
        case 'first-only':
          if (correctAnswersCount === 0) pointsEarned = currentQuestion.basePoints;
          break;
      }
    }
    
    // Update player score
    for (const [pid, p] of Object.entries(allPlayers)) {
      if (p.id === playerId) {
        const playerRef = ref(database, `players/${pid}`);
        await update(playerRef, { score: player.score + pointsEarned });
        break;
      }
    }
    
    // Store answer
    const answerRef = push(ref(database, `answers/${currentRoom.id}`));
    await set(answerRef, {
      playerId,
      playerName: player.name,
      answer,
      timeTaken,
      isCorrect,
      pointsEarned
    });
  };

  const setPlayerReady = async (playerId: string, isReady: boolean): Promise<void> => {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) throw new Error('Players not found');
    
    const allPlayers = snapshot.val() as Record<string, FirebasePlayer>;
    for (const [pid, p] of Object.entries(allPlayers)) {
      if (p.id === playerId) {
        await update(ref(database, `players/${pid}`), { isReady });
        break;
      }
    }
  };

  const nextQuestion = async (roomId: string): Promise<void> => {
    // Clear current question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
  };

  const endQuiz = async (roomId: string): Promise<void> => {
    await update(ref(database, `rooms/${roomId}`), { isCompleted: true });
    
    // Clear current question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
  };

  const leaveRoom = async (playerId: string): Promise<void> => {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) return;
    
    const allPlayers = snapshot.val() as Record<string, FirebasePlayer>;
    for (const [pid, p] of Object.entries(allPlayers)) {
      if (p.id === playerId) {
        await update(ref(database, `players/${pid}`), { isOnline: false });
        break;
      }
    }
  };

  // Real-time listeners
  useEffect(() => {
    const roomId = localStorage.getItem('current_room_id');
    if (!roomId) return;

    // Listen to room changes
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentRoom({
          ...data,
          createdAt: new Date(data.createdAt)
        });
      }
    });

    // Listen to players in the room
    const playersRef = ref(database, 'players');
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allPlayers = snapshot.val() as Record<string, FirebasePlayer>;
        const roomPlayers = Object.values(allPlayers)
          .filter((p) => p.roomId === roomId)
          .map((p) => ({
            ...p,
            joinedAt: new Date(p.joinedAt)
          }));
        setPlayers(roomPlayers as Player[]);
      } else {
        setPlayers([]);
      }
    });

    // Listen to current question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    const unsubscribeQuestion = onValue(currentQuestionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentQuestion({
          ...data,
          startedAt: new Date(data.startedAt)
        });
      } else {
        setCurrentQuestion(null);
      }
    });

    // Listen to answers
    const answersRef = ref(database, `answers/${roomId}`);
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, Answer>;
        setAnswers(Object.values(data));
      } else {
        setAnswers([]);
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeQuestion();
      unsubscribeAnswers();
    };
  }, []);

  return (
    <QuizContext.Provider
      value={{
        currentRoom,
        players,
        currentQuestion,
        answers,
        currentUserId,
        createRoom,
        joinRoom,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        publishRoom,
        startQuiz,
        publishQuestion,
        submitAnswer,
        setPlayerReady,
        nextQuestion,
        endQuiz,
        leaveRoom
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
