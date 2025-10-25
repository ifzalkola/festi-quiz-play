import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuiz, Question, QuestionType } from '@/contexts/QuizContext';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionManagerProps {
  battleId: string;
  questions: Question[];
  canEdit: boolean;
}

const QuestionManager = ({ battleId, questions, canEdit }: QuestionManagerProps) => {
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

  const [editingQuestion, setEditingQuestion] = useState({
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
      await addQuestion(battleId, newQuestion);
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

  const handleEditQuestion = async () => {
    if (!editingId) return;
    
    if (!editingQuestion.text.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (editingQuestion.type === 'multiple-choice' && editingQuestion.options?.some(o => !o?.trim())) {
      toast.error('Please fill all options');
      return;
    }

    if (!editingQuestion.correctAnswer) {
      toast.error('Please set the correct answer');
      return;
    }

    try {
      await updateQuestion(battleId, editingId, editingQuestion);
      toast.success('Question updated!');
      setEditingId(null);
      setEditingQuestion({
        text: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        imageUrl: ''
      });
    } catch (error) {
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(battleId, questionId);
      toast.success('Question deleted');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const startEditing = (question: Question) => {
    setEditingId(question.id);
    setEditingQuestion({
      text: question.text,
      type: question.type,
      options: question.options || ['', '', '', ''],
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer,
      imageUrl: question.imageUrl || ''
    });
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Textarea
                  placeholder="Enter your question... (Press Enter for new lines)"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="min-h-[100px] resize-y"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Press Enter to create multi-line questions for better readability
                </p>
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

      {/* Edit Question Dialog */}
      {canEdit && (
        <Dialog open={editingId !== null} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => setEditingQuestion({ ...editingQuestion, type: value as QuestionType })}
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
                <Textarea
                  placeholder="Enter your question... (Press Enter for new lines)"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  className="min-h-[100px] resize-y"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Press Enter to create multi-line questions for better readability
                </p>
              </div>

              <div className="space-y-2">
                <Label>Image URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={editingQuestion.imageUrl}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Add an image to make it a picture-based question (e.g., "Identify the flag")
                </p>
                {editingQuestion.imageUrl && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img 
                      src={editingQuestion.imageUrl} 
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

              {editingQuestion.type === 'true-false' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={editingQuestion.correctAnswer}
                    onValueChange={(value) => setEditingQuestion({ ...editingQuestion, correctAnswer: value })}
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

              {editingQuestion.type === 'multiple-choice' && (
                <>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {editingQuestion.options?.map((option, index) => (
                      <Input
                        key={index}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...editingQuestion.options];
                          newOptions[index] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOptions });
                        }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={editingQuestion.correctAnswer}
                      onValueChange={(value) => setEditingQuestion({ ...editingQuestion, correctAnswer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingQuestion.options?.map((option, index) => (
                          option && <SelectItem key={index} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {editingQuestion.type === 'text-input' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    placeholder="Enter correct answer..."
                    value={editingQuestion.correctAnswer}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleEditQuestion} className="flex-1">
                  Update Question
                </Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
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
                    <div className="font-medium mb-2 whitespace-pre-line">{question.text}</div>
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(question)}
                        title="Edit question"
                      >
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
