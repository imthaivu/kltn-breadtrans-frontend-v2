"use client";

import { RequireRole } from "@/components/layout/RequireAuth";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  courseApi,
  quizApi,
  speakingApi,
  uploadApi,
} from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export default function TeacherPage() {
  return (
    <RequireRole roles={["TEACHER", "ADMIN"]}>
      <TeacherPanels />
    </RequireRole>
  );
}

function TeacherPanels() {
  const qc = useQueryClient();
  const coursesQ = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.list(),
  });

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: 0,
  });
  const [classForm, setClassForm] = useState({
    courseId: 0,
    name: "",
    description: "",
  });
  const [lessonForm, setLessonForm] = useState({
    classId: 0,
    title: "",
    order: 1,
  });
  const [materialForm, setMaterialForm] = useState({
    lessonId: 0,
    title: "",
    fileUrl: "",
    fileType: "pdf",
  });
  const [quizForm, setQuizForm] = useState({
    title: "",
    type: "TOEIC",
    description: "",
    courseId: "",
  });
  const [questionForm, setQuestionForm] = useState({
    quizId: 0,
    type: "MULTIPLE_CHOICE",
    content: '{"question":"","options":["A","B","C","D"]}',
    order: 1,
  });
  const [speakingForm, setSpeakingForm] = useState({
    title: "",
    targetText: "",
    category: "TOEIC",
    difficulty: "MEDIUM",
  });

  const createCourse = useMutation({
    mutationFn: () =>
      courseApi.create({
        title: courseForm.title,
        description: courseForm.description || undefined,
        price: courseForm.price || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã tạo khóa học");
      void qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createClass = useMutation({
    mutationFn: () =>
      courseApi.createClass(classForm.courseId, {
        name: classForm.name,
        description: classForm.description || undefined,
      }),
    onSuccess: () => toast.success("Đã tạo lớp"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createLesson = useMutation({
    mutationFn: () =>
      courseApi.createLesson(lessonForm.classId, {
        title: lessonForm.title,
        order: lessonForm.order,
      }),
    onSuccess: () => toast.success("Đã tạo bài học"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addMaterial = useMutation({
    mutationFn: () =>
      courseApi.addMaterial(materialForm.lessonId, {
        title: materialForm.title,
        fileUrl: materialForm.fileUrl,
        fileType: materialForm.fileType,
      }),
    onSuccess: () => toast.success("Đã thêm tài liệu"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createQuiz = useMutation({
    mutationFn: () =>
      quizApi.create({
        title: quizForm.title,
        type: quizForm.type,
        description: quizForm.description || undefined,
        courseId: quizForm.courseId
          ? Number(quizForm.courseId)
          : undefined,
      }),
    onSuccess: () => toast.success("Đã tạo quiz"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addQuestion = useMutation({
    mutationFn: () =>
      quizApi.addQuestion(questionForm.quizId, {
        type: questionForm.type,
        content: questionForm.content,
        order: questionForm.order,
      }),
    onSuccess: () => toast.success("Đã thêm câu hỏi"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createSpeaking = useMutation({
    mutationFn: () => speakingApi.create(speakingForm),
    onSuccess: () => toast.success("Đã tạo speaking exercise"),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const uploadMaterial = useMutation({
    mutationFn: (file: File) => uploadApi.upload(file),
    onSuccess: (data) => {
      setMaterialForm((s) => ({ ...s, fileUrl: data.url }));
      toast.success("Upload xong — URL đã điền");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const courses = Array.isArray(coursesQ.data) ? coursesQ.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Khu vực giảng dạy</h1>
        <p className="text-sm text-muted">
          Tạo khóa học, lớp, bài học, quiz, speaking (TEACHER / ADMIN).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="text-base">Tạo khóa học</CardTitle>
          <Input
            label="Tiêu đề"
            value={courseForm.title}
            onChange={(e) =>
              setCourseForm((s) => ({ ...s, title: e.target.value }))
            }
          />
          <Textarea
            label="Mô tả"
            value={courseForm.description}
            onChange={(e) =>
              setCourseForm((s) => ({ ...s, description: e.target.value }))
            }
          />
          <Input
            label="Giá"
            type="number"
            value={courseForm.price}
            onChange={(e) =>
              setCourseForm((s) => ({ ...s, price: Number(e.target.value) }))
            }
          />
          <Button
            loading={createCourse.isPending}
            disabled={!courseForm.title.trim()}
            onClick={() => createCourse.mutate()}
          >
            Tạo
          </Button>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Tạo lớp</CardTitle>
          <Select
            label="Khóa học"
            value={classForm.courseId || ""}
            onChange={(e) =>
              setClassForm((s) => ({
                ...s,
                courseId: Number(e.target.value),
              }))
            }
          >
            <option value="">Chọn...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Input
            label="Tên lớp"
            value={classForm.name}
            onChange={(e) =>
              setClassForm((s) => ({ ...s, name: e.target.value }))
            }
          />
          <Textarea
            label="Mô tả"
            value={classForm.description}
            onChange={(e) =>
              setClassForm((s) => ({ ...s, description: e.target.value }))
            }
          />
          <Button
            loading={createClass.isPending}
            disabled={!classForm.courseId || !classForm.name.trim()}
            onClick={() => createClass.mutate()}
          >
            Tạo lớp
          </Button>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Tạo bài học</CardTitle>
          <Input
            label="Class ID"
            type="number"
            value={lessonForm.classId || ""}
            onChange={(e) =>
              setLessonForm((s) => ({
                ...s,
                classId: Number(e.target.value),
              }))
            }
          />
          <Input
            label="Tiêu đề"
            value={lessonForm.title}
            onChange={(e) =>
              setLessonForm((s) => ({ ...s, title: e.target.value }))
            }
          />
          <Input
            label="Thứ tự"
            type="number"
            value={lessonForm.order}
            onChange={(e) =>
              setLessonForm((s) => ({
                ...s,
                order: Number(e.target.value),
              }))
            }
          />
          <Button
            loading={createLesson.isPending}
            disabled={!lessonForm.classId || !lessonForm.title.trim()}
            onClick={() => createLesson.mutate()}
          >
            Tạo lesson
          </Button>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Thêm tài liệu</CardTitle>
          <Input
            label="Lesson ID"
            type="number"
            value={materialForm.lessonId || ""}
            onChange={(e) =>
              setMaterialForm((s) => ({
                ...s,
                lessonId: Number(e.target.value),
              }))
            }
          />
          <Input
            label="Tiêu đề"
            value={materialForm.title}
            onChange={(e) =>
              setMaterialForm((s) => ({ ...s, title: e.target.value }))
            }
          />
          <Input
            label="File URL"
            value={materialForm.fileUrl}
            onChange={(e) =>
              setMaterialForm((s) => ({ ...s, fileUrl: e.target.value }))
            }
          />
          <input
            type="file"
            className="text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadMaterial.mutate(f);
            }}
          />
          <Button
            loading={addMaterial.isPending}
            disabled={
              !materialForm.lessonId ||
              !materialForm.title.trim() ||
              !materialForm.fileUrl.trim()
            }
            onClick={() => addMaterial.mutate()}
          >
            Thêm material
          </Button>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Tạo quiz</CardTitle>
          <Input
            label="Tiêu đề"
            value={quizForm.title}
            onChange={(e) =>
              setQuizForm((s) => ({ ...s, title: e.target.value }))
            }
          />
          <Select
            label="Loại"
            value={quizForm.type}
            onChange={(e) =>
              setQuizForm((s) => ({ ...s, type: e.target.value }))
            }
          >
            {[
              "TOEIC",
              "IELTS",
              "LISTENING_PRACTICE",
              "BILINGUAL_READING",
              "GENERAL",
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Textarea
            label="Mô tả"
            value={quizForm.description}
            onChange={(e) =>
              setQuizForm((s) => ({ ...s, description: e.target.value }))
            }
          />
          <Input
            label="Course ID (tuỳ chọn)"
            value={quizForm.courseId}
            onChange={(e) =>
              setQuizForm((s) => ({ ...s, courseId: e.target.value }))
            }
          />
          <Button
            loading={createQuiz.isPending}
            disabled={!quizForm.title.trim()}
            onClick={() => createQuiz.mutate()}
          >
            Tạo quiz
          </Button>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Thêm câu hỏi</CardTitle>
          <Input
            label="Quiz ID"
            type="number"
            value={questionForm.quizId || ""}
            onChange={(e) =>
              setQuestionForm((s) => ({
                ...s,
                quizId: Number(e.target.value),
              }))
            }
          />
          <Input
            label="Type"
            value={questionForm.type}
            onChange={(e) =>
              setQuestionForm((s) => ({ ...s, type: e.target.value }))
            }
          />
          <Textarea
            label="Content (JSON hoặc text)"
            value={questionForm.content}
            onChange={(e) =>
              setQuestionForm((s) => ({ ...s, content: e.target.value }))
            }
          />
          <Button
            loading={addQuestion.isPending}
            disabled={!questionForm.quizId}
            onClick={() => addQuestion.mutate()}
          >
            Thêm câu hỏi
          </Button>
        </Card>

        <Card className="space-y-3 lg:col-span-2">
          <CardTitle className="text-base">Tạo Speaking exercise</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              value={speakingForm.title}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, title: e.target.value }))
              }
            />
            <Select
              label="Category"
              value={speakingForm.category}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, category: e.target.value }))
              }
            >
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
              <option value="GENERAL">GENERAL</option>
            </Select>
            <Select
              label="Difficulty"
              value={speakingForm.difficulty}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, difficulty: e.target.value }))
              }
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </Select>
          </div>
          <Textarea
            label="Target text (câu cần đọc)"
            value={speakingForm.targetText}
            onChange={(e) =>
              setSpeakingForm((s) => ({ ...s, targetText: e.target.value }))
            }
          />
          <Button
            loading={createSpeaking.isPending}
            disabled={
              !speakingForm.title.trim() || !speakingForm.targetText.trim()
            }
            onClick={() => createSpeaking.mutate()}
          >
            Tạo exercise
          </Button>
        </Card>
      </div>
    </div>
  );
}
