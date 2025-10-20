import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Firebase imports (uncomment when ready to integrate)
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, doc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
// import { getDatabase, ref, onValue, set, push } from 'firebase/database';

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

// Mock data for development
const MOCK_ROOMS: QuizRoom[] = [];
const MOCK_PLAYERS: Player[] = [];

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoom, setCurrentRoom] = useState<QuizRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Firebase initialization (uncomment when ready)
  // useEffect(() => {
  //   const firebaseConfig = {
  //     apiKey: "YOUR_API_KEY",
  //     authDomain: "YOUR_AUTH_DOMAIN",
  //     databaseURL: "YOUR_DATABASE_URL",
  //     projectId: "YOUR_PROJECT_ID",
  //     storageBucket: "YOUR_STORAGE_BUCKET",
  //     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  //     appId: "YOUR_APP_ID"
  //   };
  //   const app = initializeApp(firebaseConfig);
  //   const db = getFirestore(app);
  //   const rtdb = getDatabase(app);
  // }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async (name: string, ownerName: string, maxPlayers: number): Promise<string> => {
    // Firebase implementation (uncomment when ready)
    // const roomRef = await addDoc(collection(db, 'rooms'), {
    //   name,
    //   code: generateRoomCode(),
    //   ownerId: 'current-user-id', // Get from auth
    //   ownerName,
    //   maxPlayers,
    //   questions: [],
    //   isPublished: false,
    //   isStarted: false,
    //   isCompleted: false,
    //   currentQuestionIndex: -1,
    //   createdAt: new Date()
    // });
    // return roomRef.id;

    // Mock implementation
    const roomId = `room_${Date.now()}`;
    const newRoom: QuizRoom = {
      id: roomId,
      name,
      code: generateRoomCode(),
      ownerId: 'mock_owner',
      ownerName,
      maxPlayers,
      questions: [],
      isPublished: false,
      isStarted: false,
      isCompleted: false,
      currentQuestionIndex: -1,
      createdAt: new Date()
    };
    MOCK_ROOMS.push(newRoom);
    setCurrentRoom(newRoom);
    return roomId;
  };

  const joinRoom = async (code: string, playerName: string): Promise<void> => {
    // Firebase implementation (uncomment when ready)
    // const roomQuery = query(collection(db, 'rooms'), where('code', '==', code));
    // const roomSnapshot = await getDocs(roomQuery);
    // if (roomSnapshot.empty) throw new Error('Room not found');
    // const room = roomSnapshot.docs[0];
    // await addDoc(collection(db, 'players'), {
    //   name: playerName,
    //   roomId: room.id,
    //   score: 0,
    //   isReady: false,
    //   isOnline: true,
    //   joinedAt: new Date()
    // });

    // Mock implementation
    const room = MOCK_ROOMS.find(r => r.code === code);
    if (!room) throw new Error('Room not found');
    if (!room.isPublished) throw new Error('Room not published yet');
    if (room.isStarted) throw new Error('Quiz already started');
    
    const playerId = `player_${Date.now()}`;
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      roomId: room.id,
      score: 0,
      isReady: false,
      isOnline: true,
      joinedAt: new Date()
    };
    MOCK_PLAYERS.push(newPlayer);
    setCurrentRoom(room);
    setPlayers([...MOCK_PLAYERS.filter(p => p.roomId === room.id)]);
  };

  const addQuestion = async (roomId: string, question: Omit<Question, 'id'>): Promise<void> => {
    // Firebase: await updateDoc(doc(db, 'rooms', roomId), { questions: arrayUnion(question) });
    
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}`
    };
    room.questions.push(newQuestion);
    setCurrentRoom({ ...room });
  };

  const updateQuestion = async (roomId: string, questionId: string, updates: Partial<Question>): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    const questionIndex = room.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) throw new Error('Question not found');
    
    room.questions[questionIndex] = { ...room.questions[questionIndex], ...updates };
    setCurrentRoom({ ...room });
  };

  const deleteQuestion = async (roomId: string, questionId: string): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    room.questions = room.questions.filter(q => q.id !== questionId);
    setCurrentRoom({ ...room });
  };

  const publishRoom = async (roomId: string): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    if (room.questions.length === 0) throw new Error('Add at least one question');
    
    room.isPublished = true;
    setCurrentRoom({ ...room });
  };

  const startQuiz = async (roomId: string): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    room.isStarted = true;
    setCurrentRoom({ ...room });
  };

  const publishQuestion = async (
    roomId: string,
    questionIndex: number,
    basePoints: number,
    scoringMode: ScoringMode,
    timeLimit: number
  ): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    const question = room.questions[questionIndex];
    if (!question) throw new Error('Question not found');
    
    room.currentQuestionIndex = questionIndex;
    setCurrentRoom({ ...room });
    setCurrentQuestion({
      question,
      basePoints,
      scoringMode,
      timeLimit,
      startedAt: new Date()
    });
    setAnswers([]);
  };

  const submitAnswer = async (playerId: string, answer: string): Promise<void> => {
    if (!currentQuestion) throw new Error('No active question');
    
    const player = MOCK_PLAYERS.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    const timeTaken = (Date.now() - currentQuestion.startedAt.getTime()) / 1000;
    const isCorrect = Array.isArray(currentQuestion.question.correctAnswer)
      ? currentQuestion.question.correctAnswer.includes(answer)
      : currentQuestion.question.correctAnswer === answer;
    
    let pointsEarned = 0;
    if (isCorrect) {
      const answerCount = answers.filter(a => a.isCorrect).length;
      
      switch (currentQuestion.scoringMode) {
        case 'time-based':
          pointsEarned = Math.max(0, currentQuestion.basePoints - Math.floor(timeTaken));
          break;
        case 'order-based':
          if (answerCount === 0) pointsEarned = currentQuestion.basePoints;
          else if (answerCount === 1) pointsEarned = Math.floor(currentQuestion.basePoints * 0.7);
          else if (answerCount === 2) pointsEarned = Math.floor(currentQuestion.basePoints * 0.4);
          break;
        case 'first-only':
          if (answerCount === 0) pointsEarned = currentQuestion.basePoints;
          break;
      }
    }
    
    player.score += pointsEarned;
    
    const newAnswer: Answer = {
      playerId,
      playerName: player.name,
      answer,
      timeTaken,
      isCorrect,
      pointsEarned
    };
    
    setAnswers([...answers, newAnswer]);
    setPlayers([...MOCK_PLAYERS.filter(p => p.roomId === player.roomId)]);
  };

  const setPlayerReady = async (playerId: string, isReady: boolean): Promise<void> => {
    const player = MOCK_PLAYERS.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    player.isReady = isReady;
    setPlayers([...MOCK_PLAYERS.filter(p => p.roomId === player.roomId)]);
  };

  const nextQuestion = async (roomId: string): Promise<void> => {
    setCurrentQuestion(null);
    setAnswers([]);
  };

  const endQuiz = async (roomId: string): Promise<void> => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    
    room.isCompleted = true;
    setCurrentRoom({ ...room });
    setCurrentQuestion(null);
  };

  const leaveRoom = async (playerId: string): Promise<void> => {
    const playerIndex = MOCK_PLAYERS.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      MOCK_PLAYERS.splice(playerIndex, 1);
      setPlayers([...MOCK_PLAYERS]);
    }
  };

  return (
    <QuizContext.Provider
      value={{
        currentRoom,
        players,
        currentQuestion,
        answers,
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
