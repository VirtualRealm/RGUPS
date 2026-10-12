import data from "@/content/teachers.json";
export const teachers = data.teachers;
export type Teacher = (typeof teachers)[number];
export type TeacherSummary = Pick<
  Teacher,
  | "id"
  | "name"
  | "position"
  | "degree"
  | "title"
  | "levels"
  | "disciplines"
  | "programCodes"
>;
export function teacherSummaries(): TeacherSummary[] {
  return teachers.map(
    ({
      id,
      name,
      position,
      degree,
      title,
      levels,
      disciplines,
      programCodes,
    }) => ({
      id,
      name,
      position,
      degree,
      title,
      levels,
      disciplines,
      programCodes,
    }),
  );
}
