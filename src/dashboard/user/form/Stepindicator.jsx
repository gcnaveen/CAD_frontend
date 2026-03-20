// src/dashboard/user/form/StepIndicator.jsx
import React from "react";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
  </svg>
);

const STEPS = [
  { label: "Location",  labelKn: "ಸ್ಥಳ"      },
  { label: "Drawing",   labelKn: "ನಕ್ಷೆ"      },
  { label: "Documents", labelKn: "ದಾಖಲೆ"     },
  { label: "Review",    labelKn: "ಪರಿಶೀಲನೆ"  },
];

const StepIndicator = ({ current = 0 }) => (
  <div className="w-full overflow-x-auto">
    <div className="flex items-center min-w-max px-1 py-1">
      {STEPS.map((step, idx) => {
        const done    = idx < current;
        const active  = idx === current;
        const pending = idx > current;

        return (
          <React.Fragment key={step.label}>
            {/* Step bubble + label */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Bubble */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 transition-all
                  ${done    ? "bg-orange-600 text-white shadow-[0_2px_8px_rgba(234,88,12,0.35)]" : ""}
                  ${active  ? "bg-orange-600 text-white shadow-[0_2px_12px_rgba(234,88,12,0.4)] ring-4 ring-orange-100" : ""}
                  ${pending ? "bg-white border-2 border-slate-200 text-slate-400" : ""}
                `}
              >
                {done ? <CheckIcon /> : <span>{idx + 1}</span>}
              </div>

              {/* Label */}
              <div className="flex flex-col leading-none">
                <span className={`text-[10px] font-semibold whitespace-nowrap ${active || done ? "text-orange-600" : "text-slate-400"}`}>
                  {step.labelKn}
                </span>
                <span className={`text-xs sm:text-sm font-extrabold whitespace-nowrap ${active ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className="mx-2 sm:mx-3 flex items-center gap-0.5 shrink-0">
                <div className={`w-4 sm:w-6 h-0.5 rounded-full ${idx < current ? "bg-orange-400" : "bg-slate-200"}`} />
                <div className={`w-1 h-1 rounded-full ${idx < current ? "bg-orange-400" : "bg-slate-200"}`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

export default StepIndicator;