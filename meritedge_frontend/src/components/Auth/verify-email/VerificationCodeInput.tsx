import React, { useState, useRef, useEffect } from "react";

interface VerificationCodeInputProps {
  onChange: (otp: string) => void;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({ onChange }) => {
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    onChange(newCode.join(""));

    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-5 items-center">
      {[0, 1, 2, 3].map((index) => (
        <input
          type="text"
          maxLength={1}
          key={index}
          ref={(el) => { (inputRefs.current[index] = el) }}
          className="flex flex-1 shrink justify-center items-center self-stretch px-2 py-4 my-auto rounded-xl basis-0 max-md:px-5 text-center text-black min-w-5 min-h-10 w-[15px] border border-slate-200 border-solid focus:outline-none focus:border-[#ea5a00]"
          value={code[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Verification code digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput;
