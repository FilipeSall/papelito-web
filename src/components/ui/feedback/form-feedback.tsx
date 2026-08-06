import { FormErrorAlert } from "./form-error-alert";
import { FormStatusOutput } from "./form-status-output";

export type FormFeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

export function FormFeedback({
  feedback,
}: Readonly<{
  feedback: FormFeedbackState;
}>) {
  if (!feedback) {
    return null;
  }

  if (feedback.type === "error") {
    return <FormErrorAlert message={feedback.message} />;
  }

  return <FormStatusOutput message={feedback.message} />;
}
