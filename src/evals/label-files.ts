/**
 * The label files on disk, under docs/evals/labels: the only place they are
 * read or written. Reading goes through the seal, so a label on a sealed item
 * never reaches tuning code: it is dropped unless the access is a final run.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { emptyLabelFile, labelFileName, LABELS_DIR, parseLabelFile, parseLabelFileName, type AnyLabelFile, type LabelFile, type LabelSet } from "./labels";
import { readableIds, type Access } from "./sealed";

export const labelFilePath = (set: LabelSet, labeller: string, dir = LABELS_DIR): string => path.join(dir, labelFileName(set, labeller));

/** Only the labels the access may read. */
function sealed<S extends LabelSet>(file: LabelFile<S>, access: Access): LabelFile<S> {
  const ids = readableIds(file.set, access);
  return { ...file, labels: file.labels.filter((label) => ids.has(label.id)) };
}

function readFile(file: string, expected: { set: LabelSet; labeller: string }): AnyLabelFile {
  const parsed = parseLabelFile(JSON.parse(readFileSync(file, "utf8")));
  if (parsed.set !== expected.set || parsed.labeller !== expected.labeller) {
    throw new Error(`${file} says it is ${parsed.set} by ${parsed.labeller}; its name says ${expected.set} by ${expected.labeller}`);
  }
  return parsed;
}

/** Every label file in the directory, in name order, each cut down to what the access may read. */
export function readLabelFiles(access: Access, dir = LABELS_DIR): AnyLabelFile[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const named = parseLabelFileName(name);
      return named ? [sealed(readFile(path.join(dir, name), named), access) as AnyLabelFile] : [];
    });
}

/** One labeller's file for a set, or an empty one when they have not started. */
export function readLabels<S extends LabelSet>(set: S, labeller: string, access: Access, dir = LABELS_DIR): LabelFile<S> {
  const file = labelFilePath(set, labeller, dir);
  let parsed: LabelFile<S>;
  try {
    parsed = readFile(file, { set, labeller }) as LabelFile<S>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyLabelFile(set, labeller);
    throw error;
  }
  return sealed(parsed, access);
}

export function writeLabels(file: AnyLabelFile, dir = LABELS_DIR): string {
  mkdirSync(dir, { recursive: true });
  const target = labelFilePath(file.set, file.labeller, dir);
  writeFileSync(target, `${JSON.stringify(parseLabelFile(file), null, 2)}\n`);
  return target;
}
