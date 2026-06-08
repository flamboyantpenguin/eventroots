import { useContext } from "react";
import { ErrorContext } from "/src/context/misc/ErrorContext";

export const useError = () => {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error(
      "useError must be utilized within a valid LoadingProvider boundary.",
    );
  }
  return context;
};
