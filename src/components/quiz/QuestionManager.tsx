import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuiz, Question, QuestionType } from '@/contexts/QuizContext';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionManagerProps {
  roomId: string;
  questions: Question[];
  canEdit: boolean;
}

const QuestionManager = ({ roomId, questions, canEdit }: QuestionManagerProps) => {
  const { addQuestion, updateQuestion, deleteQuestion } = useQuiz();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'multiple-choice' as QuestionType,
    options: ['', '', '', ''],
    correctAnswer: '',
    imageUrl: ''
  });

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (newQuestion.type === 'multiple-choice' && newQuestion.options?.some(o => !o?.trim())) {
      toast.error('Please fill all options');
      return;
    }

    if (!newQuestion.correctAnswer) {
      toast.error('Please set the correct answer');
      return;
    }

    try {
      await addQuestion(roomId, newQuestion);
      toast.success('Question added!');
      setNewQuestion({
        text: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        imageUrl: ''
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(roomId, questionId);
      toast.success('Question deleted');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={newQuestion.type}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as QuestionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="text-input">Text Input</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input
                  placeholder="Enter your question..."
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={newQuestion.imageUrl}
                  onChange={(e) => setNewQuestion({ ...newQuestion, imageUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Add an image to make it a picture-based question (e.g., "Identify the flag")
                </p>
                {newQuestion.imageUrl && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img 
                      src={newQuestion.imageUrl} 
                      alt="Question preview" 
                      className="max-w-full h-auto max-h-40 sm:max-h-48 rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        toast.error('Invalid image URL');
                      }}
                    />
                  </div>
                )}
              </div>

              {newQuestion.type === 'true-false' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={newQuestion.correctAnswer}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, correctAnswer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newQuestion.type === 'multiple-choice' && (
                <>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {newQuestion.options?.map((option, index) => (
                      <Input
                        key={index}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={newQuestion.correctAnswer}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, correctAnswer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {newQuestion.options?.map((option, index) => (
                          option && <SelectItem key={index} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {newQuestion.type === 'text-input' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    placeholder="Enter correct answer..."
                    value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                  />
                </div>
              )}

              <Button onClick={handleAddQuestion} className="w-full">
                Add Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-3">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              {canEdit && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          questions?.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Q{index + 1}.</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {question.type}
                      </span>
                    </div>
                    <p className="font-medium mb-2">{question.text}</p>
                    {question.imageUrl && (
                      <div className="my-3">
                        <img 
                          src={question.imageUrl} 
                          alt="Question" 
                          className="max-w-full h-auto max-h-32 sm:max-h-40 rounded-md border"
                        />
                      </div>
                    )}
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {question.options.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={option === question.correctAnswer ? 'text-green-600 font-semibold' : ''}>
                              {option === question.correctAnswer && <Check className="w-3 h-3 inline mr-1" />}
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionManager;
