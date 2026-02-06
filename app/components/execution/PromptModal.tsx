import { useState } from "react";
import { X } from "lucide-react";

interface PromptModalProps {
  data: Record<string, unknown>;
  onSubmit: (value: string | null) => void;
  onCancel: () => void;
}

export function PromptModal({ data, onSubmit, onCancel }: PromptModalProps) {
  const [inputValue, setInputValue] = useState(
    (data.defaultValue as string) || ""
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    (data.defaults as { selected?: string[] })?.selected || []
  );

  const promptType = data.type as string;
  const title = (data.title as string) || "Input Required";
  const message = (data.message as string) || "";
  const options = (data.options as string[]) || [];
  const multiSelect = data.multiSelect === true;
  const button1 = (data.button1 as string) || "OK";
  const button2 = data.button2 as string | undefined;
  const inputTitle = data.inputTitle as string | undefined;
  const multiline = data.multiline === true;

  const handleSubmit = () => {
    if (promptType === "dialog") {
      onSubmit(
        JSON.stringify({
          button: button1,
          selected: selectedOptions,
          input: inputTitle ? inputValue : undefined,
        })
      );
    } else {
      onSubmit(inputValue);
    }
  };

  const handleButton2 = () => {
    if (button2) {
      onSubmit(
        JSON.stringify({
          button: button2,
          selected: selectedOptions,
          input: inputTitle ? inputValue : undefined,
        })
      );
    } else {
      onCancel();
    }
  };

  const toggleOption = (option: string) => {
    if (multiSelect) {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option]
      );
    } else {
      setSelectedOptions([option]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          )}

          {/* Options */}
          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type={multiSelect ? "checkbox" : "radio"}
                    name="options"
                    checked={selectedOptions.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Text Input */}
          {(promptType === "value" || inputTitle) && (
            <div>
              {inputTitle && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {inputTitle}
                </label>
              )}
              {multiline ? (
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !multiline) handleSubmit();
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          {button2 && (
            <button
              onClick={handleButton2}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              {button2}
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {button1}
          </button>
        </div>
      </div>
    </div>
  );
}
