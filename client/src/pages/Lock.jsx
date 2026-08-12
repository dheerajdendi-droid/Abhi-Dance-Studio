import { useEffect, useState } from "react";
import PinPad from "../components/PinPad.jsx";
import { useLogin, useSetupPin } from "../lib/useAuth.js";

const PIN_LENGTH = 4;

export default function Lock({ pinSet }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState("enter"); // enter | confirm
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const login = useLogin();
  const setup = useSetupPin();

  const busy = login.isPending || setup.isPending;
  const activeValue = pinSet ? pin : stage === "enter" ? pin : confirmPin;

  function triggerError(message) {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setPin("");
    setConfirmPin("");
    setStage("enter");
  }

  useEffect(() => {
    if (pinSet && pin.length === PIN_LENGTH) {
      login.mutate(pin, {
        onError: (err) => triggerError(err.message || "Incorrect PIN"),
        onSuccess: () => setError(""),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, pinSet]);

  useEffect(() => {
    if (!pinSet && stage === "enter" && pin.length === PIN_LENGTH) {
      setFirstPin(pin);
      setStage("confirm");
    }
  }, [pin, pinSet, stage]);

  useEffect(() => {
    if (!pinSet && stage === "confirm" && confirmPin.length === PIN_LENGTH) {
      if (confirmPin !== firstPin) {
        triggerError("PINs didn't match — try again");
        setFirstPin("");
        return;
      }
      setup.mutate(confirmPin, {
        onError: (err) => triggerError(err.message || "Something went wrong"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, pinSet, stage, firstPin]);

  function handleChange(next) {
    setError("");
    if (pinSet) {
      setPin(next);
    } else if (stage === "enter") {
      setPin(next);
    } else {
      setConfirmPin(next);
    }
  }

  const heading = pinSet
    ? "Enter your PIN"
    : stage === "enter"
    ? "Set up a PIN"
    : "Confirm your PIN";

  const subheading = pinSet
    ? "Welcome back"
    : "Choose a 4-digit PIN to lock the app";

  return (
    <div className="min-h-screen bg-plum-900 flex flex-col items-center justify-center px-6 text-cream-50">
      <div className="text-center mb-10">
        <p className="font-display text-3xl font-semibold text-marigold-400">Abhi's Dance Studio</p>
        <h1 className="mt-3 text-lg font-medium">{heading}</h1>
        <p className="text-sm text-plum-100/70 mt-1">{subheading}</p>
      </div>
      <div className={shake ? "animate-[shake_0.4s]" : ""}>
        <PinPad value={activeValue} maxLength={PIN_LENGTH} onChange={handleChange} disabled={busy} />
      </div>
      <p className="mt-6 h-5 text-coral-500 text-sm font-medium">{error}</p>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
