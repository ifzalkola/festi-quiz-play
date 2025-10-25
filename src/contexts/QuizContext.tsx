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
interface FirebaseBattle {
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
  showFinalResults: boolean;
  revealedRounds: number;
  createdAt: string;
}

interface FirebasePlayer {
  id: string;
  name: string;
  battleId: string;
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

export interface QuizBattle {
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
  showFinalResults: boolean;
  revealedRounds: number;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  battleId: string;
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
  imageUrl?: string;
}

export interface Contest {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  battleIds: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface ContestPlayerScore {
  playerId: string;
  playerName: string;
  totalScore: number;
  battleScores: { [battleId: string]: number };
}

interface QuizContextType {
  // Battle state
  currentBattle: QuizBattle | null;
  players: Player[];
  currentQuestion: CurrentQuestion | null;
  answers: Answer[];
  roundStatistics: RoundStatistics[];
  currentUserId: string | null;
  
  // Actions
  createBattle: (name: string, ownerName: string, maxPlayers: number) => Promise<string>;
  joinBattle: (code: string, playerName: string) => Promise<void>;
  addQuestion: (battleId: string, question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (battleId: string, questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (battleId: string, questionId: string) => Promise<void>;
  publishBattle: (battleId: string) => Promise<void>;
  startQuiz: (battleId: string) => Promise<void>;
  publishQuestion: (battleId: string, questionIndex: number, basePoints: number, scoringMode: ScoringMode, timeLimit: number) => Promise<void>;
  submitAnswer: (playerId: string, answer: string, timeTaken: number) => Promise<void>;
  setPlayerReady: (playerId: string, isReady: boolean) => Promise<void>;
  nextQuestion: (battleId: string) => Promise<void>;
  endQuiz: (battleId: string) => Promise<void>;
  showLeaderboard: (battleId: string) => Promise<void>;
  hideLeaderboard: (battleId: string) => Promise<void>;
  showFinalResults: (battleId: string) => Promise<void>;
  updateRevealedRounds: (battleId: string, rounds: number) => Promise<void>;
  leaveBattle: (playerId: string) => Promise<void>;
  
  // Admin battle management
  getAllBattles: () => Promise<QuizBattle[]>;
  deleteBattle: (battleId: string) => Promise<void>;
  updateBattle: (battleId: string, updates: Partial<QuizBattle>) => Promise<void>;
  
  // Contest management
  createContest: (name: string, battleIds: string[]) => Promise<string>;
  getAllContests: () => Promise<Contest[]>;
  getContest: (contestId: string) => Promise<Contest | null>;
  getContestByCode: (code: string) => Promise<Contest | null>;
  updateContest: (contestId: string, updates: Partial<Contest>) => Promise<void>;
  deleteContest: (contestId: string) => Promise<void>;
  getContestLeaderboard: (contestId: string) => Promise<ContestPlayerScore[]>;
  canAccessContest: (contestId: string) => Promise<boolean>;
  
  // Utility functions
  clearBattleState: () => void;
  loadBattle: (battleId: string) => void;
  canRejoinBattle: (code: string) => Promise<{ canRejoin: boolean; playerName?: string; message?: string }>;
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
  const [currentBattle, setCurrentBattle] = useState<QuizBattle | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [roundStatistics, setRoundStatistics] = useState<RoundStatistics[]>([]);
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const { currentUser, hasPermission } = useAuth();
  
  // Use authenticated user's userId
  const currentUserId = currentUser?.userId || null;

  const generateBattleCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Helper function to check if current user owns a battle
  const checkBattleOwnership = async (battleId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) return false;
    
    const battle = snapshot.val();
    return battle.ownerId === currentUserId;
  };

  // Helper function to check if user can manage a battle (owner or admin)
  const canManageBattle = async (battleId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    // Admins can manage any battle
    if (hasPermission('canManageUsers')) return true;
    
    // Regular users can only manage their own battles
    return await checkBattleOwnership(battleId);
  };

  const createBattle = async (name: string, ownerName: string, maxPlayers: number): Promise<string> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canCreateBattles')) throw new Error('You do not have permission to create battles');
    
    // Clear any existing battle state to prevent redirects
    setCurrentBattle(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswers([]);
    setRoundStatistics([]);
    
    const battleRef = push(ref(database, 'battles'));
    const battleId = battleRef.key!;
    
    const newBattle = {
      id: battleId,
      name,
      code: generateBattleCode(),
      ownerId: currentUserId,
      ownerName,
      maxPlayers,
      questions: [],
      isPublished: false,
      isStarted: false,
      isCompleted: false,
      currentQuestionIndex: -1,
      showLeaderboard: false,
      showFinalResults: false,
      revealedRounds: 1,
      createdAt: new Date().toISOString()
    };
    
    await set(battleRef, newBattle);
    
    // Set the battle ID in state so listeners pick it up
    setCurrentBattleId(battleId);
    
    return battleId;
  };

  const joinBattle = async (code: string, playerName: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canJoinBattles')) throw new Error('You do not have permission to join battles');
    
    // Find battle by code
    const battlesRef = ref(database, 'battles');
    const snapshot = await get(battlesRef);
    
    let foundBattle: FirebaseBattle | null = null;
    let foundBattleId: string | null = null;
    
    if (snapshot.exists()) {
      const battles = snapshot.val() as Record<string, FirebaseBattle>;
      for (const [battleId, battle] of Object.entries(battles)) {
        if (battle.code === code) {
          foundBattle = battle;
          foundBattleId = battleId;
          break;
        }
      }
    }
    
    if (!foundBattle || !foundBattleId) throw new Error('Battle not found');
    if (!foundBattle.isPublished) throw new Error('Battle not published yet');
    if (foundBattle.isCompleted) throw new Error('Quiz has already ended');
    
    // Check if user already has a player in this battle (rejoin scenario)
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    let existingPlayer: FirebasePlayer | null = null;
    let existingPlayerId: string | null = null;
    
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      for (const [playerId, player] of Object.entries(allPlayers)) {
        if (player.battleId === foundBattleId && player.userId === currentUserId) {
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
      
      // Store player ID and battle ID in localStorage and state
      localStorage.setItem('current_player_id', existingPlayerId);
      localStorage.setItem('current_battle_id', foundBattleId);
      setCurrentBattleId(foundBattleId);
      
      return; // Exit early for rejoin
    }
    
    // If quiz has started, only allow rejoining (not new joins)
    if (foundBattle.isStarted) {
      throw new Error('Quiz has started. You can only rejoin if you were previously in this battle.');
    }
    
    // Check player count for new joins
    let currentPlayerCount = 0;
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      currentPlayerCount = Object.values(allPlayers).filter(
        (p) => p.battleId === foundBattleId && p.isOnline
      ).length;
    }
    
    if (currentPlayerCount >= foundBattle.maxPlayers) {
      throw new Error('Battle is full');
    }
    
    // Create new player (only for new joins before quiz starts)
    const playerRef = push(ref(database, 'players'));
    const playerId = playerRef.key!;
    
    const newPlayer = {
      id: playerId,
      name: playerName,
      battleId: foundBattleId,
      score: 0,
      isReady: false,
      isOnline: true,
      joinedAt: new Date().toISOString(),
      userId: currentUserId
    };
    
    await set(playerRef, newPlayer);
    
    // Store player ID and battle ID in localStorage and state
    localStorage.setItem('current_player_id', playerId);
    localStorage.setItem('current_battle_id', foundBattleId);
    setCurrentBattleId(foundBattleId);
  };

  const addQuestion = async (battleId: string, question: Omit<Question, 'id'>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to add questions to this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    const battle = snapshot.val();
    const questions = battle.questions || [];
    
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    questions.push(newQuestion);
    await update(battleRef, { questions });
  };

  const updateQuestion = async (battleId: string, questionId: string, updates: Partial<Question>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to edit questions in this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    const battle = snapshot.val();
    const questions = battle.questions || [];
    const questionIndex = questions.findIndex((q: Question) => q.id === questionId);
    
    if (questionIndex === -1) throw new Error('Question not found');
    
    questions[questionIndex] = { ...questions[questionIndex], ...updates };
    await update(battleRef, { questions });
  };

  const deleteQuestion = async (battleId: string, questionId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to delete questions from this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    const battle = snapshot.val();
    const questions = (battle.questions || []).filter((q: Question) => q.id !== questionId);
    await update(battleRef, { questions });
  };

  const publishBattle = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to publish this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    const battle = snapshot.val();
    if (!battle.questions || battle.questions.length === 0) {
      throw new Error('Add at least one question');
    }
    
    await update(battleRef, { isPublished: true });
  };

  const startQuiz = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to start this battle\'s quiz');
    }
    
    await update(ref(database, `battles/${battleId}`), { isStarted: true });
  };

  const publishQuestion = async (
    battleId: string,
    questionIndex: number,
    basePoints: number,
    scoringMode: ScoringMode,
    timeLimit: number
  ): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to publish questions in this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    const battle = snapshot.val();
    const question = battle.questions[questionIndex];
    
    if (!question) throw new Error('Question not found');
    
    await update(battleRef, { currentQuestionIndex: questionIndex });
    
    // Set current question in Firebase with server-side timing
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
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
    
    // Store question settings separately for recovery if currentQuestion is cleared
    // This helps preserve settings even if currentQuestion gets removed
    const questionSettingsRef = ref(database, `questionSettings/${battleId}/${questionIndex}`);
    await set(questionSettingsRef, {
      basePoints,
      scoringMode,
      timeLimit
    });
    
    // Clear previous answers
    const answersRef = ref(database, `answers/${battleId}`);
    await remove(answersRef);
  };

  const submitAnswer = async (playerId: string, answer: string, timeTaken: number): Promise<void> => {
    if (!currentQuestion || !currentBattle) throw new Error('No active question');
    
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
    
    // CRITICAL: Check if player has already submitted an answer for this question
    const answersRef = ref(database, `answers/${currentBattle.id}`);
    const answersSnapshot = await get(answersRef);
    const currentAnswers = answersSnapshot.exists() ? Object.values(answersSnapshot.val() as Record<string, Answer>) : [];
    
    // Check for duplicate submission
    const hasAlreadyAnswered = currentAnswers.some((a) => a.playerId === playerId);
    if (hasAlreadyAnswered) {
      throw new Error('You have already submitted an answer for this question');
    }
    
    // Check answer - case-insensitive comparison for text inputs
    const isCorrect = Array.isArray(currentQuestion.question.correctAnswer)
      ? currentQuestion.question.correctAnswer.some(ca => ca.toLowerCase().trim() === answer.toLowerCase().trim())
      : currentQuestion.question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // For time-based scoring, calculate points immediately
    let pointsEarned = 0;
    if (isCorrect && currentQuestion.scoringMode === 'time-based') {
      // Eg: 30 points, answer in 0-3 secs = 30 points, answer in 4-6 secs = 27 points, answer in 7-9 secs = 24 points, etc.
      const range = currentQuestion.timeLimit / 10;
      const mod = Math.ceil((currentQuestion.timeLimit - timeTaken) / range);
      pointsEarned = currentQuestion.basePoints * (mod / 10);
      if (pointsEarned < 0) pointsEarned = 0;
      
      // Update player score immediately for time-based scoring
      for (const [pid, p] of Object.entries(allPlayers)) {
        if (p.id === playerId) {
          const playerRef = ref(database, `players/${pid}`);
          await update(playerRef, { score: player.score + pointsEarned });
          break;
        }
      }
    }
    
    // Store answer (points will be calculated later for order-based and first-only)
    const answerRef = push(ref(database, `answers/${currentBattle.id}`));
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

  // Helper function to calculate and award points for order-based and first-only scoring
  const calculateAndAwardPoints = async (
    battleId: string,
    answers: Answer[],
    scoringMode: ScoringMode,
    basePoints: number
  ): Promise<void> => {
    if (scoringMode === 'time-based') {
      // Points already awarded during submission
      return;
    }

    // Get all players to update their scores
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    
    if (!playersSnapshot.exists()) return;
    
    const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
    
    // Filter correct answers and sort by time taken (lower timeTaken = submitted earlier)
    const correctAnswers = answers
      .filter(answer => answer.isCorrect)
      .sort((a, b) => a.timeTaken - b.timeTaken);

    // Calculate points based on scoring mode
    for (let i = 0; i < correctAnswers.length; i++) {
      const answer = correctAnswers[i];
      let pointsEarned = 0;

      if (scoringMode === 'order-based') {
        if (i === 0) pointsEarned = basePoints;
        else if (i === 1) pointsEarned = Math.floor(basePoints * 0.7);
        else if (i === 2) pointsEarned = Math.floor(basePoints * 0.4);
        // No points for 4th+ correct answers
      } else if (scoringMode === 'first-only') {
        if (i === 0) pointsEarned = basePoints;
        // No points for 2nd+ correct answers
      }

      // Update the answer with calculated points
      const answersRef = ref(database, `answers/${battleId}`);
      const answersSnapshot = await get(answersRef);
      
      if (answersSnapshot.exists()) {
        const answersData = answersSnapshot.val() as Record<string, Answer>;
        for (const [answerId, answerData] of Object.entries(answersData)) {
          if (answerData.playerId === answer.playerId && answerData.timeTaken === answer.timeTaken) {
            await update(ref(database, `answers/${battleId}/${answerId}`), { pointsEarned });
            break;
          }
        }
      }

      // Update player score
      for (const [pid, player] of Object.entries(allPlayers)) {
        if (player.id === answer.playerId) {
          const playerRef = ref(database, `players/${pid}`);
          await update(playerRef, { score: player.score + pointsEarned });
          break;
        }
      }
    }
  };

  // Helper function to get question data and settings for saving statistics
  const getQuestionDataForStats = async (
    battleId: string,
    questionIndex: number,
    currentQuestionSnapshot: any
  ): Promise<{ questionData: any; questionSettings: any } | null> => {
    let questionData;
    let questionSettings;
    
    if (currentQuestionSnapshot.exists()) {
      // Current question still exists in Firebase
      const cq = currentQuestionSnapshot.val();
      questionData = cq.question;
      questionSettings = {
        scoringMode: cq.scoringMode,
        basePoints: cq.basePoints,
        timeLimit: cq.timeLimit
      };
      return { questionData, questionSettings };
    }
    
    // Current question was cleared, try to recover from stored settings and battle data
    const battleRef = ref(database, `battles/${battleId}`);
    const battleSnapshot = await get(battleRef);
    
    if (!battleSnapshot.exists()) return null;
    
    const battle = battleSnapshot.val();
    const question = battle.questions[questionIndex];
    
    if (!question) return null;
    
    questionData = question;
    
    // Try to get stored settings for this question
    const questionSettingsRef = ref(database, `questionSettings/${battleId}/${questionIndex}`);
    const settingsSnapshot = await get(questionSettingsRef);
    
    if (settingsSnapshot.exists()) {
      questionSettings = settingsSnapshot.val();
    } else {
      // Use default settings if we can't recover them
      questionSettings = {
        scoringMode: 'time-based' as ScoringMode,
        basePoints: 100,
        timeLimit: 30
      };
    }
    
    return { questionData, questionSettings };
  };

  const nextQuestion = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to manage this battle\'s quiz');
    }
    
    // Get fresh data from Firebase to ensure we have the latest state
    const battleRef = ref(database, `battles/${battleId}`);
    const battleSnapshot = await get(battleRef);
    
    if (!battleSnapshot.exists()) {
      throw new Error('Battle not found');
    }
    
    const battle = battleSnapshot.val();
    
    // Get current question data (might be null if already cleared by hideLeaderboard)
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
    const currentQuestionSnapshot = await get(currentQuestionRef);
    
    // Get current answers
    const answersRef = ref(database, `answers/${battleId}`);
    const answersSnapshot = await get(answersRef);
    const currentAnswers = answersSnapshot.exists() 
      ? Object.values(answersSnapshot.val() as Record<string, Answer>) 
      : [];
    
    // Check if we need to save statistics
    // We can reconstruct the question data from the battle if currentQuestion was cleared
    const shouldSaveStats = battle.currentQuestionIndex >= 0 && currentAnswers.length > 0;
    
    if (shouldSaveStats) {
      // Get question data and settings using helper function
      const questionInfo = await getQuestionDataForStats(
        battleId,
        battle.currentQuestionIndex,
        currentQuestionSnapshot
      );
      
      if (questionInfo) {
        const { questionData, questionSettings } = questionInfo;
        
        // Calculate and award points for order-based and first-only scoring BEFORE creating statistics
        await calculateAndAwardPoints(
          battleId,
          currentAnswers,
          questionSettings.scoringMode,
          questionSettings.basePoints
        );
        
        // Get updated answers with correct points
        const updatedAnswersSnapshot = await get(answersRef);
        const updatedAnswers = updatedAnswersSnapshot.exists() 
          ? Object.values(updatedAnswersSnapshot.val() as Record<string, Answer>) 
          : currentAnswers;
        
        const roundStats: RoundStatistics = {
          questionIndex: battle.currentQuestionIndex,
          questionText: questionData.text,
          correctAnswer: questionData.correctAnswer,
          scoringMode: questionSettings.scoringMode,
          basePoints: questionSettings.basePoints,
          timeLimit: questionSettings.timeLimit,
          answers: [...updatedAnswers],
          imageUrl: questionData.imageUrl
        };
        
        // Check if this round was already saved to avoid duplicates
        const roundStatsRef = ref(database, `roundStatistics/${battleId}`);
        const roundStatsSnapshot = await get(roundStatsRef);
        
        let alreadySaved = false;
        if (roundStatsSnapshot.exists()) {
          const existingStats = Object.values(roundStatsSnapshot.val() as Record<string, RoundStatistics>);
          alreadySaved = existingStats.some(stat => stat.questionIndex === battle.currentQuestionIndex);
        }
        
        if (!alreadySaved) {
          // Store in Firebase for persistence and sharing using push to avoid race conditions
          const newRoundRef = push(roundStatsRef);
          await set(newRoundRef, roundStats);
        }
      }
    }
    
    // Clear current question
    await remove(currentQuestionRef);
  };

  const endQuiz = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to end this battle\'s quiz');
    }
    
    // Get fresh data from Firebase to ensure we have the latest state
    const battleRef = ref(database, `battles/${battleId}`);
    const battleSnapshot = await get(battleRef);
    
    if (!battleSnapshot.exists()) {
      throw new Error('Battle not found');
    }
    
    const battle = battleSnapshot.val();
    
    // Get current question data (might be null if already cleared)
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
    const currentQuestionSnapshot = await get(currentQuestionRef);
    
    // Get current answers
    const answersRef = ref(database, `answers/${battleId}`);
    const answersSnapshot = await get(answersRef);
    const currentAnswers = answersSnapshot.exists() 
      ? Object.values(answersSnapshot.val() as Record<string, Answer>) 
      : [];
    
    // Check if we need to save final round statistics
    const shouldSaveStats = battle.currentQuestionIndex >= 0 && currentAnswers.length > 0;
    
    if (shouldSaveStats) {
      // Get question data and settings using helper function
      const questionInfo = await getQuestionDataForStats(
        battleId,
        battle.currentQuestionIndex,
        currentQuestionSnapshot
      );
      
      if (questionInfo) {
        const { questionData, questionSettings } = questionInfo;
        
        // Calculate and award points for order-based and first-only scoring BEFORE creating statistics
        await calculateAndAwardPoints(
          battleId,
          currentAnswers,
          questionSettings.scoringMode,
          questionSettings.basePoints
        );
        
        // Get updated answers with correct points
        const updatedAnswersSnapshot = await get(answersRef);
        const updatedAnswers = updatedAnswersSnapshot.exists() 
          ? Object.values(updatedAnswersSnapshot.val() as Record<string, Answer>) 
          : currentAnswers;
        
        const roundStats: RoundStatistics = {
          questionIndex: battle.currentQuestionIndex,
          questionText: questionData.text,
          correctAnswer: questionData.correctAnswer,
          scoringMode: questionSettings.scoringMode,
          basePoints: questionSettings.basePoints,
          timeLimit: questionSettings.timeLimit,
          answers: [...updatedAnswers],
          imageUrl: questionData.imageUrl
        };
        
        // Check if this round was already saved to avoid duplicates
        const roundStatsRef = ref(database, `roundStatistics/${battleId}`);
        const roundStatsSnapshot = await get(roundStatsRef);
        
        let alreadySaved = false;
        if (roundStatsSnapshot.exists()) {
          const existingStats = Object.values(roundStatsSnapshot.val() as Record<string, RoundStatistics>);
          alreadySaved = existingStats.some(stat => stat.questionIndex === battle.currentQuestionIndex);
        }
        
        if (!alreadySaved) {
          // Store in Firebase for persistence and sharing using push to avoid race conditions
          const newRoundRef = push(roundStatsRef);
          await set(newRoundRef, roundStats);
        }
      }
    }
    
    await update(ref(database, `battles/${battleId}`), { 
      isCompleted: true,
      showFinalResults: false // Don't show final results immediately
    });
    
    // Clear current question
    await remove(currentQuestionRef);
  };

  const showLeaderboard = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to show leaderboard for this battle');
    }
    
    // Get fresh data from Firebase to ensure we have the latest state
    const battleRef = ref(database, `battles/${battleId}`);
    const battleSnapshot = await get(battleRef);
    
    if (!battleSnapshot.exists()) {
      throw new Error('Battle not found');
    }
    
    const battle = battleSnapshot.val();
    
    // IMPORTANT: Save round statistics BEFORE showing leaderboard
    // Get current question data (should still exist at this point)
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
    const currentQuestionSnapshot = await get(currentQuestionRef);
    
    // Get current answers
    const answersRef = ref(database, `answers/${battleId}`);
    const answersSnapshot = await get(answersRef);
    const currentAnswers = answersSnapshot.exists() 
      ? Object.values(answersSnapshot.val() as Record<string, Answer>) 
      : [];
    
    // Save statistics if we have data to save
    const shouldSaveStats = battle.currentQuestionIndex >= 0 && currentAnswers.length > 0;
    
    if (shouldSaveStats) {
      // Get question data and settings using helper function
      const questionInfo = await getQuestionDataForStats(
        battleId,
        battle.currentQuestionIndex,
        currentQuestionSnapshot
      );
      
      if (questionInfo) {
        const { questionData, questionSettings } = questionInfo;
        
        // Calculate and award points for order-based and first-only scoring BEFORE creating statistics
        await calculateAndAwardPoints(
          battleId,
          currentAnswers,
          questionSettings.scoringMode,
          questionSettings.basePoints
        );
        
        // Get updated answers with correct points
        const updatedAnswersSnapshot = await get(answersRef);
        const updatedAnswers = updatedAnswersSnapshot.exists() 
          ? Object.values(updatedAnswersSnapshot.val() as Record<string, Answer>) 
          : currentAnswers;
        
        const roundStats: RoundStatistics = {
          questionIndex: battle.currentQuestionIndex,
          questionText: questionData.text,
          correctAnswer: questionData.correctAnswer,
          scoringMode: questionSettings.scoringMode,
          basePoints: questionSettings.basePoints,
          timeLimit: questionSettings.timeLimit,
          answers: [...updatedAnswers],
          imageUrl: questionData.imageUrl
        };
        
        // Check if this round was already saved to avoid duplicates
        const roundStatsRef = ref(database, `roundStatistics/${battleId}`);
        const roundStatsSnapshot = await get(roundStatsRef);
        
        let alreadySaved = false;
        if (roundStatsSnapshot.exists()) {
          const existingStats = Object.values(roundStatsSnapshot.val() as Record<string, RoundStatistics>);
          alreadySaved = existingStats.some(stat => stat.questionIndex === battle.currentQuestionIndex);
        }
        
        if (!alreadySaved) {
          // Store in Firebase for persistence and sharing using push to avoid race conditions
          const newRoundRef = push(roundStatsRef);
          await set(newRoundRef, roundStats);
        }
      }
    }
    
    // Advance to next question so host sees the correct question when returning to control
    const nextQuestionIndex = battle.currentQuestionIndex + 1;
    
    // Only advance if there are more questions
    if (nextQuestionIndex < battle.questions.length) {
      await update(battleRef, { 
        currentQuestionIndex: nextQuestionIndex,
        showLeaderboard: true 
      });
    } else {
      // If no more questions, just show leaderboard
      await update(battleRef, { showLeaderboard: true });
    }
    
    // Clear current question so players see waiting state instead of last question
    await remove(currentQuestionRef);
  };

  const hideLeaderboard = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to hide leaderboard for this battle');
    }
    
    // Simply hide leaderboard and clear current question
    await update(ref(database, `battles/${battleId}`), { showLeaderboard: false });
    
    // Clear current question so players see waiting state instead of last question
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
    await remove(currentQuestionRef);
  };

  const showFinalResults = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to show final results for this battle');
    }
    
    // Get battle data to set revealedRounds to total questions
    const battleRef = ref(database, `battles/${battleId}`);
    const battleSnapshot = await get(battleRef);
    
    if (!battleSnapshot.exists()) {
      throw new Error('Battle not found');
    }
    
    const battle = battleSnapshot.val();
    const totalQuestions = battle.questions.length;
    
    await update(ref(database, `battles/${battleId}`), { 
      showFinalResults: true,
      revealedRounds: 1 
    });
  };

  const updateRevealedRounds = async (battleId: string, rounds: number): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to update revealed rounds for this battle');
    }
    
    await update(ref(database, `battles/${battleId}`), { revealedRounds: rounds });
  };

  const leaveBattle = async (playerId: string): Promise<void> => {
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

  // Admin battle management functions
  const getAllBattles = async (): Promise<QuizBattle[]> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    const battlesRef = ref(database, 'battles');
    const snapshot = await get(battlesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const battles = snapshot.val() as Record<string, FirebaseBattle>;
    const allBattles = Object.values(battles).map(battle => ({
      ...battle,
      createdAt: new Date(battle.createdAt)
    }));
    
    // If user is admin, return all battles
    if (hasPermission('canManageUsers')) {
      return allBattles;
    }
    
    // If user is not admin, only return battles they own
    return allBattles.filter(battle => battle.ownerId === currentUserId);
  };

  const deleteBattle = async (battleId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle (owner or admin)
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to delete this battle');
    }
    
    // Delete the battle
    const battleRef = ref(database, `battles/${battleId}`);
    await remove(battleRef);
    
    // Delete all players in this battle
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    
    if (playersSnapshot.exists()) {
      const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
      const deletePromises = Object.entries(allPlayers)
        .filter(([, player]) => player.battleId === battleId)
        .map(([playerId]) => remove(ref(database, `players/${playerId}`)));
      
      await Promise.all(deletePromises);
    }
    
    // Delete current question if exists
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
    await remove(currentQuestionRef);
    
    // Delete answers if exist
    const answersRef = ref(database, `answers/${battleId}`);
    await remove(answersRef);
    
    // Delete round statistics if exist
    const roundStatsRef = ref(database, `roundStatistics/${battleId}`);
    await remove(roundStatsRef);
    
    // Delete question settings if exist
    const questionSettingsRef = ref(database, `questionSettings/${battleId}`);
    await remove(questionSettingsRef);
  };

  const updateBattle = async (battleId: string, updates: Partial<QuizBattle>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Check if user can manage this battle (owner or admin)
    if (!(await canManageBattle(battleId))) {
      throw new Error('You do not have permission to update this battle');
    }
    
    const battleRef = ref(database, `battles/${battleId}`);
    const snapshot = await get(battleRef);
    
    if (!snapshot.exists()) throw new Error('Battle not found');
    
    // Convert Date objects to strings for Firebase
    const firebaseUpdates: any = { ...updates };
    if (firebaseUpdates.createdAt instanceof Date) {
      firebaseUpdates.createdAt = firebaseUpdates.createdAt.toISOString();
    }
    
    await update(battleRef, firebaseUpdates);
  };

  const clearBattleState = () => {
    setCurrentBattle(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswers([]);
    setRoundStatistics([]);
    setCurrentBattleId(null);
    localStorage.removeItem('current_battle_id');
    localStorage.removeItem('current_player_id');
  };

  const loadBattle = (battleId: string) => {
    // Set the battle ID in localStorage and state
    localStorage.setItem('current_battle_id', battleId);
    setCurrentBattleId(battleId);
  };

  const canRejoinBattle = async (code: string): Promise<{ canRejoin: boolean; playerName?: string; message?: string }> => {
    if (!currentUserId) {
      return { canRejoin: false, message: 'User not authenticated' };
    }

    try {
      // Find battle by code
      const battlesRef = ref(database, 'battles');
      const snapshot = await get(battlesRef);
      
      let foundBattleId: string | null = null;
      
      if (snapshot.exists()) {
        const battles = snapshot.val() as Record<string, FirebaseBattle>;
        for (const [battleId, battle] of Object.entries(battles)) {
          if (battle.code === code) {
            foundBattleId = battleId;
            break;
          }
        }
      }
      
      if (!foundBattleId) {
        return { canRejoin: false, message: 'Battle not found' };
      }

      // Check if user has a player in this battle
      const playersRef = ref(database, 'players');
      const playersSnapshot = await get(playersRef);
      
      if (playersSnapshot.exists()) {
        const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
        for (const [playerId, player] of Object.entries(allPlayers)) {
          if (player.battleId === foundBattleId && player.userId === currentUserId) {
            return { 
              canRejoin: true, 
              playerName: player.name,
              message: 'You can rejoin this battle'
            };
          }
        }
      }
      
      return { canRejoin: false, message: 'You were not previously in this battle' };
    } catch (error) {
      return { canRejoin: false, message: 'Error checking rejoin status' };
    }
  };

  // Contest management functions
  const generateContestCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createContest = async (name: string, battleIds: string[]): Promise<string> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canManageUsers')) throw new Error('Only admins can create contests');
    
    // Validate that all battles exist and are published
    const battlesRef = ref(database, 'battles');
    const battlesSnapshot = await get(battlesRef);
    
    if (!battlesSnapshot.exists()) throw new Error('No battles found');
    
    const allBattles = battlesSnapshot.val() as Record<string, FirebaseBattle>;
    const validBattles = battleIds.filter(battleId => {
      const battle = allBattles[battleId];
      return battle && battle.isPublished;
    });
    
    if (validBattles.length !== battleIds.length) {
      throw new Error('Some battles are invalid or not published');
    }
    
    const contestRef = push(ref(database, 'contests'));
    const contestId = contestRef.key!;
    
    const newContest = {
      id: contestId,
      name,
      code: generateContestCode(),
      ownerId: currentUserId,
      ownerName: currentUser?.userId || 'Admin',
      battleIds,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    await set(contestRef, newContest);
    return contestId;
  };

  const getAllContests = async (): Promise<Contest[]> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canManageUsers')) throw new Error('Only admins can view all contests');
    
    const contestsRef = ref(database, 'contests');
    const snapshot = await get(contestsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const contests = snapshot.val() as Record<string, any>;
    return Object.values(contests).map(contest => ({
      ...contest,
      createdAt: new Date(contest.createdAt)
    }));
  };

  const getContest = async (contestId: string): Promise<Contest | null> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    const contestRef = ref(database, `contests/${contestId}`);
    const snapshot = await get(contestRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const contest = snapshot.val();
    return {
      ...contest,
      createdAt: new Date(contest.createdAt)
    };
  };

  const getContestByCode = async (code: string): Promise<Contest | null> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    const contestsRef = ref(database, 'contests');
    const snapshot = await get(contestsRef);
    
    if (!snapshot.exists()) return null;
    
    const contests = snapshot.val() as Record<string, any>;
    for (const [contestId, contest] of Object.entries(contests)) {
      if (contest.code === code) {
        return {
          ...contest,
          id: contestId,
          createdAt: new Date(contest.createdAt)
        };
      }
    }
    
    return null;
  };

  const updateContest = async (contestId: string, updates: Partial<Contest>): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canManageUsers')) throw new Error('Only admins can update contests');
    
    const contestRef = ref(database, `contests/${contestId}`);
    const snapshot = await get(contestRef);
    
    if (!snapshot.exists()) throw new Error('Contest not found');
    
    // Convert Date objects to strings for Firebase
    const firebaseUpdates: any = { ...updates };
    if (firebaseUpdates.createdAt instanceof Date) {
      firebaseUpdates.createdAt = firebaseUpdates.createdAt.toISOString();
    }
    
    await update(contestRef, firebaseUpdates);
  };

  const deleteContest = async (contestId: string): Promise<void> => {
    if (!currentUserId) throw new Error('User not authenticated');
    if (!hasPermission('canManageUsers')) throw new Error('Only admins can delete contests');
    
    const contestRef = ref(database, `contests/${contestId}`);
    await remove(contestRef);
  };

  const getContestLeaderboard = async (contestId: string): Promise<ContestPlayerScore[]> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Get contest data
    const contest = await getContest(contestId);
    if (!contest) throw new Error('Contest not found');
    
    // Get all players from all battles in the contest
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    
    if (!playersSnapshot.exists()) return [];
    
    const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
    
    // Filter players who are in battles that belong to this contest
    const contestPlayers = Object.values(allPlayers).filter(player => 
      contest.battleIds.includes(player.battleId) && player.isOnline
    );
    
    // Group players by userId and calculate aggregated scores
    const playerScores = new Map<string, ContestPlayerScore>();
    
    for (const player of contestPlayers) {
      const existingScore = playerScores.get(player.userId);
      
      if (existingScore) {
        // Update existing player score
        existingScore.totalScore += player.score;
        existingScore.battleScores[player.battleId] = player.score;
      } else {
        // Create new player score entry
        playerScores.set(player.userId, {
          playerId: player.userId,
          playerName: player.name,
          totalScore: player.score,
          battleScores: { [player.battleId]: player.score }
        });
      }
    }
    
    // Convert to array and sort by total score
    return Array.from(playerScores.values()).sort((a, b) => b.totalScore - a.totalScore);
  };

  const canAccessContest = async (contestId: string): Promise<boolean> => {
    if (!currentUserId) throw new Error('User not authenticated');
    
    // Admins can access all contests
    if (hasPermission('canManageUsers')) return true;
    
    // Get contest data
    const contest = await getContest(contestId);
    if (!contest) return false;
    
    // Check if user is a player in any of the contest's battles
    const playersRef = ref(database, 'players');
    const playersSnapshot = await get(playersRef);
    
    if (!playersSnapshot.exists()) return false;
    
    const allPlayers = playersSnapshot.val() as Record<string, FirebasePlayer>;
    const userPlayers = Object.values(allPlayers).filter(player => 
      player.userId === currentUserId && 
      contest.battleIds.includes(player.battleId) &&
      player.isOnline
    );
    
    return userPlayers.length > 0;
  };

  // Real-time listeners
  useEffect(() => {
    // Use currentBattleId state instead of localStorage directly
    const battleId = currentBattleId || localStorage.getItem('current_battle_id');
    
    if (!battleId) {
      // Clear battle state if no battle ID
      setCurrentBattle(null);
      setPlayers([]);
      setCurrentQuestion(null);
      setAnswers([]);
      setRoundStatistics([]);
      return;
    }

    // Listen to battle changes
    const battleRef = ref(database, `battles/${battleId}`);
    const unsubscribeBattle = onValue(battleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentBattle({
          ...data,
          createdAt: new Date(data.createdAt)
        });
      } else {
        setCurrentBattle(null);
      }
    });

    // Listen to players in the battle
    const playersRef = ref(database, 'players');
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allPlayers = snapshot.val() as Record<string, FirebasePlayer>;
        const battlePlayers = Object.values(allPlayers)
          .filter((p) => p.battleId === battleId)
          .map((p) => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            rejoinedAt: p.rejoinedAt ? new Date(p.rejoinedAt) : undefined
          }));
        setPlayers(battlePlayers as Player[]);
      } else {
        setPlayers([]);
      }
    });

    // Listen to current question
    const currentQuestionRef = ref(database, `currentQuestions/${battleId}`);
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
    const answersRef = ref(database, `answers/${battleId}`);
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, Answer>;
        setAnswers(Object.values(data));
      } else {
        setAnswers([]);
      }
    });

    // Listen to round statistics
    const roundStatsRef = ref(database, `roundStatistics/${battleId}`);
    const unsubscribeRoundStats = onValue(roundStatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, RoundStatistics>;
        // Convert object to array and sort by questionIndex
        const statsArray = Object.values(data).sort((a, b) => a.questionIndex - b.questionIndex);
        setRoundStatistics(statsArray);
      } else {
        setRoundStatistics([]);
      }
    });

    return () => {
      unsubscribeBattle();
      unsubscribePlayers();
      unsubscribeQuestion();
      unsubscribeAnswers();
      unsubscribeRoundStats();
    };
  }, [currentBattleId]); // Now depends on currentBattleId state

  return (
    <QuizContext.Provider
      value={{
        currentBattle,
        players,
        currentQuestion,
        answers,
        roundStatistics,
        currentUserId,
        createBattle,
        joinBattle,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        publishBattle,
        startQuiz,
        publishQuestion,
        submitAnswer,
        setPlayerReady,
        nextQuestion,
        endQuiz,
        showLeaderboard,
        hideLeaderboard,
        showFinalResults,
        updateRevealedRounds,
        leaveBattle,
        getAllBattles,
        deleteBattle,
        updateBattle,
        createContest,
        getAllContests,
        getContest,
        getContestByCode,
        updateContest,
        deleteContest,
        getContestLeaderboard,
        canAccessContest,
        clearBattleState,
        loadBattle,
        canRejoinBattle
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
