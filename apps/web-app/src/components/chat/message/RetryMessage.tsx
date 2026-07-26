import { useCallback, useEffect, useState } from "react";

interface RetryMessageProps {
  attempt: number;
  message: string;
  next: number;
}

export function RetryMessage({ message, attempt, next }: RetryMessageProps) {
  const calculateTimeLeft = useCallback(() => {
    const difference = next - new Date().getTime();

    if (difference <= 0) {
      return 0;
    }

    return Math.floor(difference / 1000);
  }, [next]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="text-destructive">
      {message} attempt {attempt} retry in {formatTime(timeLeft)}
    </div>
  );
}
