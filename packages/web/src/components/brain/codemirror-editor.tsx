'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { autocompletion, CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language';
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  dropCursor,
} from '@codemirror/view';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  filePaths: string[];
}

// Braintree warm theme matching globals.css
const braintreeTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    backgroundColor: 'transparent',
    color: '#2B2A25',
  },
  '.cm-content': {
    caretColor: '#5B9A65',
    padding: '8px 0',
    lineHeight: '1.6',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#5B9A65',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(91, 154, 101, 0.22) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(91, 154, 101, 0.06)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(91, 154, 101, 0.08)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'rgba(43, 42, 37, 0.3)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontSize: '11px',
    minWidth: '2.5em',
  },
  '.cm-tooltip': {
    backgroundColor: '#FAFAF5',
    border: '1px solid rgba(43, 42, 37, 0.12)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(43, 42, 37, 0.1)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
      fontSize: '12px',
    },
    '& > ul > li': {
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'rgba(91, 154, 101, 0.12)',
      color: '#2B2A25',
    },
  },
  '.cm-completionLabel': {
    color: '#2B2A25',
  },
  '.cm-completionDetail': {
    color: 'rgba(43, 42, 37, 0.5)',
    fontStyle: 'italic',
    marginLeft: '8px',
  },
  // Markdown heading styling
  '.cm-header-1': { fontSize: '1.4em', fontWeight: '700' },
  '.cm-header-2': { fontSize: '1.2em', fontWeight: '600' },
  '.cm-header-3': { fontSize: '1.1em', fontWeight: '600' },
});

export default function CodeMirrorEditor({
  content,
  onChange,
  onSave,
  filePaths,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const filePathsRef = useRef(filePaths);

  // Keep refs up to date
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  filePathsRef.current = filePaths;

  // Wikilink autocomplete
  const wikilinkCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // Check if we're inside [[ ... ]]
      const line = context.state.doc.lineAt(context.pos);
      const textBefore = line.text.slice(0, context.pos - line.from);
      const match = textBefore.match(/\[\[([^\]]*)$/);
      if (!match) return null;

      const query = match[1].toLowerCase();
      const from = context.pos - match[1].length;

      const options = filePathsRef.current
        .map((fp) => {
          const name = fp.split('/').pop()?.replace(/\.md$/, '') ?? fp;
          return { label: name, detail: fp };
        })
        .filter(
          (opt) =>
            opt.label.toLowerCase().includes(query) ||
            opt.detail.toLowerCase().includes(query)
        )
        .slice(0, 20);

      return {
        from,
        options,
        filter: false,
      };
    },
    []
  );

  // Keyboard shortcuts
  const saveKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            onSaveRef.current();
            return true;
          },
        },
        {
          key: 'Mod-b',
          run: (view) => {
            wrapSelection(view, '**');
            return true;
          },
        },
        {
          key: 'Mod-i',
          run: (view) => {
            wrapSelection(view, '*');
            return true;
          },
        },
      ]),
    []
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        history(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        autocompletion({
          override: [wikilinkCompletion],
          activateOnTyping: true,
        }),
        braintreeTheme,
        saveKeymap,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
        ]),
        cmPlaceholder('Start writing...'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only initialize once; content changes are tracked via onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-y-auto [&_.cm-editor]:min-h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:min-h-full"
    />
  );
}

function wrapSelection(view: EditorView, wrapper: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  if (selected.length > 0) {
    // Wrap existing selection
    view.dispatch({
      changes: { from, to, insert: wrapper + selected + wrapper },
      selection: { anchor: from + wrapper.length, head: to + wrapper.length },
    });
  } else {
    // Insert wrapper pair and place cursor in middle
    view.dispatch({
      changes: { from, to, insert: wrapper + wrapper },
      selection: { anchor: from + wrapper.length },
    });
  }
}
