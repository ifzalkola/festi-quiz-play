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
import { useAuth } from './AuthContext';

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
  showLeaderboard: boolean;
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
  rejoinedAt?: string;
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
  showLeaderboard: boolean;
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
  rejoinedAt?: Date;
  userId: string;
}

export interface CurrentQuestion {
  question: Question;
  basePoints: number;
  scoringMode: ScoringMode;
  timeLimit: number;
  startedAt: Date;
  endsAt: Date;
}

export interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
  timeTaken: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface RoundStatistics {
  questionIndex: number;
  questionText: string;
  correctAnswer: string | string[];
  scoringMode: ScoringMode;
  basePoints: number;
  timeLimit: number;
  answers: Answer[];
}

interface QuizContextType {
  // Room state
  currentRoom: QuizRoom | null;
  players: Player[];
  currentQuestion: CurrentQuestion | null;
  answers: Answer[];
  roundStatistics: RoundStatistics[];
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
  submitAnswer: (playerId: string, answer: string, timeTaken: number) => Promise<void>;
  setPlayerReady: (playerId: string, isReady: boolean) => Promise<void>;
  nextQuestion: (roomId: string) => Promise<void>;
  endQuiz: (roomId: string) => Promise<void>;
  showLeaderboard: (roomId: string) => Promise<void>;
  hideLeaderboard: (roomId: string) => Promise<void>;
  leaveRoom: (playerId: string) => Promise<void>;
  
  // Admin room management
  getAllRooms: () => Promise<QuizRoom[]>;
  deleteRoom: (roomId: string) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<QuizRoom>) => Promise<void>;
  
  // Utility functions
  clearRoomState: () => void;
  loadRoom: (roomId: string) => void;
  canRejoinRoom: (code: string) => Promise<{ canRejoin: boolean; playerName?: string; message?: string }>;
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
  const [roundStatistics, setRoundStatistics] = useState<RoundStatistics[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const { currentUser, hasPermission } = useAuth();
  
  // Use authenticated user's userId
  const currentUserId = currentUser?.userId || null;

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Helper function to check if current user owns a room
  const checkRoomOwnership = async (roomId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const room = snapshot.val();
    return room.ownerId === currentUserId;
  };

  // Helper function to check if user can manage a room (owner or admin)
  const canManageRoom = async (roomId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    // Admins can manage any room
    if (hasPermission('canManageUsers')) return true;
    
    // Regular users can only manage their own rooms
    return await checkRoomOwnership(roomId);
  };

  const createRoom = async (name: string, ownerName: string, maxPlayers: number): Promise<string> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canCreateRooms')) throw new Error('You do not have permission to create rooms');
    
    // Clear any existing room state to prevent redirects
    setCurrentRoom(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswers([]);
    setRoundStatistics([]);
    
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
      showLeaderboard: false,
      createdAt: new Date().toISOString()
    };
    
    await set(roomRef, newRoom);
    
    // Set the room ID in state so listeners pick it up
    setCurrentRoomId(roomId);
    
    return roomId;
  };

  const joinRoom = async (code: string, playerName: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canJoinRooms')) throw new Error('You do not have permission to join rooms');
    
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
    if (foundRoom.isCompleted) throw new Error('Quiz has already ended');
    
    // Check if user already has a player in this room (rejoin scenario)
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    let existingPlayer: FirebasePlayer | null = null;
    let existingPlayerId: string | null = null;
    
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      for (const [playerId, player] of Object.entries(allPlayers)) {
        if (player.roomId === foundRoomId && player.userId === currentUserId) {
          existingPlayer = player;
          existingPlayerId = playerId;
          break;
        }
      }
    }
    
    // If player exists, rejoin them (preserve their progress)
    if (existingPlayer && existingPlayerId) {
      // Update player status to online
      const playerRef = ref(database, `players/${existingPlayerId}`);
      await update(playerRef, {
        isOnline: true,
        name: playerName, // Update name in case they want to change it
        rejoinedAt: new Date().toISOString()
      });
      
      // Store player ID and room ID in localStorage and state
      localStorage.setItem('current_player_id', existingPlayerId);
      localStorage.setItem('current_room_id', foundRoomId);
      setCurrentRoomId(foundRoomId);
      
      return; // Exit early for rejoin
    }
    
    // If quiz has started, only allow rejoining (not new joins)
    if (foundRoom.isStarted) {
      throw new Error('Quiz has started. You can only rejoin if you were previously in this room.');
    }
    
    // Check player count for new joins
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
    
    // Create new player (only for new joins before quiz starts)
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
    
    // Store player ID and room ID in localStorage and state
    localStorage.setItem('current_player_id', playerId);
    localStorage.setItem('current_room_id', foundRoomId);
    setCurrentRoomId(foundRoomId);
  };

  const addQuestion = async (roomId: string, question: Omit<Question, 'id'>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to add questions to this room');
    }
    
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
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to edit questions in this room');
    }
    
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
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to delete questions from this room');
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const questions = (room.questions || []).filter((q: Question) => q.id !== questionId);
    await update(roomRef, { questions });
  };

  const publishRoom = async (roomId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to publish this room');
    }
    
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
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to start this room\'s quiz');
    }
    
    await update(ref(database, `rooms/${roomId}`), { isStarted: true });
  };

  const publishQuestion = async (
    roomId: string,
    questionIndex: number,
    basePoints: number,
    scoringMode: ScoringMode,
    timeLimit: number
  ): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to publish questions in this room');
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    const room = snapshot.val();
    const question = room.questions[questionIndex];
    
    if (!question) throw new Error('Question not found');
    
    await update(roomRef, { currentQuestionIndex: questionIndex });
    
    // Set current question in Firebase with server-side timing
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    const now = new Date();
    const endsAt = new Date(now.getTime() + (timeLimit * 1000)); // Add timeLimit seconds
    
    await set(currentQuestionRef, {
      question,
      basePoints,
      scoringMode,
      timeLimit,
      startedAt: now.toISOString(),
      endsAt: endsAt.toISOString()
    });
    
    // Clear previous answers
    const answersRef = ref(database, `answers/${roomId}`);
    await remove(answersRef);
  };

  const submitAnswer = async (playerId: string, answer: string, timeTaken: number): Promise<void> => {
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
          // Eg: 30 points, answer in 0-3 secs = 30 points, answer in 4-6 secs = 27 points, answer in 7-9 secs = 24 points, etc.

          const range = currentQuestion.timeLimit / 10;
          const mod = Math.ceil((currentQuestion.timeLimit - timeTaken) / range);
          pointsEarned = currentQuestion.basePoints * (mod / 10);
          if (pointsEarned < 0) pointsEarned = 0;
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
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to manage this room\'s quiz');
    }
    
    // Store current round statistics before clearing
    if (currentQuestion && currentRoom && answers.length > 0) {
      const roundStats: RoundStatistics = {
        questionIndex: currentRoom.currentQuestionIndex,
        questionText: currentQuestion.question.text,
        correctAnswer: currentQuestion.question.correctAnswer,
        scoringMode: currentQuestion.scoringMode,
        basePoints: currentQuestion.basePoints,
        timeLimit: currentQuestion.timeLimit,
        answers: [...answers]
      };
      
      // Store in local state
      setRoundStatistics(prev => [...prev, roundStats]);
      
      // Store in Firebase for persistence and sharing
      const roundStatsRef = ref(database, `roundStatistics/${roomId}`);
      const snapshot = await get(roundStatsRef);
      const existingStats = snapshot.exists() ? snapshot.val() : [];
      const updatedStats = [...existingStats, roundStats];
      await set(roundStatsRef, updatedStats);
    }
    
    // Clear current question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
  };

  const endQuiz = async (roomId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to end this room\'s quiz');
    }
    
    // Store final round statistics if there's a current question
    if (currentQuestion && currentRoom && answers.length > 0) {
      const roundStats: RoundStatistics = {
        questionIndex: currentRoom.currentQuestionIndex,
        questionText: currentQuestion.question.text,
        correctAnswer: currentQuestion.question.correctAnswer,
        scoringMode: currentQuestion.scoringMode,
        basePoints: currentQuestion.basePoints,
        timeLimit: currentQuestion.timeLimit,
        answers: [...answers]
      };
      
      // Store in local state
      setRoundStatistics(prev => [...prev, roundStats]);
      
      // Store in Firebase for persistence and sharing
      const roundStatsRef = ref(database, `roundStatistics/${roomId}`);
      const snapshot = await get(roundStatsRef);
      const existingStats = snapshot.exists() ? snapshot.val() : [];
      const updatedStats = [...existingStats, roundStats];
      await set(roundStatsRef, updatedStats);
    }
    
    await update(ref(database, `rooms/${roomId}`), { isCompleted: true });
    
    // Clear current question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
  };

  const showLeaderboard = async (roomId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to show leaderboard for this room');
    }
    
    await update(ref(database, `rooms/${roomId}`), { showLeaderboard: true });
  };

  const hideLeaderboard = async (roomId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to hide leaderboard for this room');
    }
    
    // Hide leaderboard and clear current question to return players to waiting state
    await update(ref(database, `rooms/${roomId}`), { showLeaderboard: false });
    
    // Clear current question so players see waiting state instead of last question
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
    
    // Advance to next question so host sees the correct question when returning to control
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val();
      const nextQuestionIndex = room.currentQuestionIndex + 1;
      
      // Only advance if there are more questions
      if (nextQuestionIndex < room.questions.length) {
        await update(roomRef, { currentQuestionIndex: nextQuestionIndex });
      }
    }
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

  // Admin room management functions
  const getAllRooms = async (): Promise<QuizRoom[]> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    const roomsRef = ref(database, 'rooms');
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const rooms = snapshot.val() as Record<string, FirebaseRoom>;
    const allRooms = Object.values(rooms).map(room => ({
      ...room,
      createdAt: new Date(room.createdAt)
    }));
    
    // If user is admin, return all rooms
    if (hasPermission('canManageUsers')) {
      return allRooms;
    }
    
    // If user is not admin, only return rooms they own
    return allRooms.filter(room => room.ownerId === currentUserId);
  };

  const deleteRoom = async (roomId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room (owner or admin)
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to delete this room');
    }
    
    // Delete the room
    const roomRef = ref(database, `rooms/${roomId}`);
    await remove(roomRef);
    
    // Delete all players in this room
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      const deletePromises = Object.entries(allPlayers)
        .filter(([, player]) => player.roomId === roomId)
        .map(([playerId]) => remove(ref(database, `players/${playerId}`)));
      
      await Promise.all(deletePromises);
    }
    
    // Delete current question if exists
    const currentQuestionRef = ref(database, `currentQuestions/${roomId}`);
    await remove(currentQuestionRef);
    
    // Delete answers if exist
    const answersRef = ref(database, `answers/${roomId}`);
    await remove(answersRef);
    
    // Delete round statistics if exist
    const roundStatsRef = ref(database, `roundStatistics/${roomId}`);
    await remove(roundStatsRef);
  };

  const updateRoom = async (roomId: string, updates: Partial<QuizRoom>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this room (owner or admin)
    if (!(await canManageRoom(roomId))) {
      throw new Error('You do not have permission to update this room');
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    
    // Convert Date objects to strings for Firebase
    const firebaseUpdates: any = { ...updates };
    if (firebaseUpdates.createdAt instanceof Date) {
      firebaseUpdates.createdAt = firebaseUpdates.createdAt.toISOString();
    }
    
    await update(roomRef, firebaseUpdates);
  };

  const clearRoomState = () => {
    setCurrentRoom(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswers([]);
    setRoundStatistics([]);
    setCurrentRoomId(null);
    localStorage.removeItem('current_room_id');
    localStorage.removeItem('current_player_id');
  };

  const loadRoom = (roomId: string) => {
    // Set the room ID in localStorage and state
    localStorage.setItem('current_room_id', roomId);
    setCurrentRoomId(roomId);
  };

  const canRejoinRoom = async (code: string): Promise<{ canRejoin: boolean; playerName?: string; message?: string }> => {
    if (!currentUserId) {
      return { canRejoin: false, message: 'User not authenticated' };
    }

    try {
      // Find room by code
      const roomsRef = ref(database, 'rooms');
      const snapshot = await get(roomsRef);
      
      let foundRoomId: string | null = null;
      
      if (snapshot.exists()) {
        const rooms = snapshot.val() as Record<string, FirebaseRoom>;
        for (const [roomId, room] of Object.entries(rooms)) {
          if (room.code === code) {
            foundRoomId = roomId;
            break;
          }
        }
      }
      
      if (!foundRoomId) {
        return { canRejoin: false, message: 'Room not found' };
      }

      // Check if user has a player in this room
      const playersRef = ref(database, 'players');
      const playersSnapshot = await get(playersRef);
      
      if (playersSnapshot.exists()) {
        const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
        for (const [playerId, player] of Object.entries(allPlayers)) {
          if (player.roomId === foundRoomId && player.userId === currentUserId) {
            return { 
              canRejoin: true, 
              playerName: player.name,
              message: 'You can rejoin this room'
            };
          }
        }
      }
      
      return { canRejoin: false, message: 'You were not previously in this room' };
    } catch (error) {
      return { canRejoin: false, message: 'Error checking rejoin status' };
    }
  };

  // Real-time listeners
  useEffect(() => {
    // Use currentRoomId state instead of localStorage directly
    const roomId = currentRoomId || localStorage.getItem('current_room_id');
    
    if (!roomId) {
      // Clear room state if no room ID
      setCurrentRoom(null);
      setPlayers([]);
      setCurrentQuestion(null);
      setAnswers([]);
      setRoundStatistics([]);
      return;
    }

    // Listen to room changes
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentRoom({
          ...data,
          createdAt: new Date(data.createdAt)
        });
      } else {
        setCurrentRoom(null);
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
            joinedAt: new Date(p.joinedAt),
            rejoinedAt: p.rejoinedAt ? new Date(p.rejoinedAt) : undefined
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
          startedAt: new Date(data.startedAt),
          endsAt: new Date(data.endsAt)
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

    // Listen to round statistics
    const roundStatsRef = ref(database, `roundStatistics/${roomId}`);
    const unsubscribeRoundStats = onValue(roundStatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as RoundStatistics[];
        setRoundStatistics(data);
      } else {
        setRoundStatistics([]);
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeQuestion();
      unsubscribeAnswers();
      unsubscribeRoundStats();
    };
  }, [currentRoomId]); // Now depends on currentRoomId state

  return (
    <QuizContext.Provider
      value={{
        currentRoom,
        players,
        currentQuestion,
        answers,
        roundStatistics,
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
        showLeaderboard,
        hideLeaderboard,
        leaveRoom,
        getAllRooms,
        deleteRoom,
        updateRoom,
        clearRoomState,
        loadRoom,
        canRejoinRoom
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
