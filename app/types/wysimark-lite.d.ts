declare module "wysimark-lite" {
  import type { CSSProperties, FC } from "react";

  export interface Editor {
    // opaque editor instance
    getMarkdown: () => string;
    setMarkdown: (markdown: string) => void;
  }

  export interface UseEditorOptions {
    authToken?: string;
    height?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    disableRawMode?: boolean;
    disableTaskList?: boolean;
    disableCodeBlock?: boolean;
    disableHighlight?: boolean;
  }

  export function useEditor(options?: UseEditorOptions): Editor;

  export interface EditableProps {
    editor: Editor;
    value: string;
    onChange: (markdown: string) => void;
    throttleInMs?: number;
    placeholder?: string;
    className?: string;
    style?: CSSProperties;
    onImageChange?: (images: unknown[]) => void;
  }

  export const Editable: FC<EditableProps>;

  export function createWysimark(options?: {
    initialMarkdown?: string;
  }): {
    editor: Editor;
    Editable: FC<EditableProps>;
  };
}
