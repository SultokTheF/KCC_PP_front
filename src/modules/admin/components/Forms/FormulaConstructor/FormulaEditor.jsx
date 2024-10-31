// FormulaEditor.js
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const FormulaEditor = ({ value, onChange, existingFormulas = [] }) => {
  const [editorValue, setEditorValue] = useState(value);

  // Define the functions and variables
  const allowedFunctions = [
    'SUM', 'AVERAGE', 'AVG', 'MAX', 'MIN', 'COUNT', 'IF', 'ABS', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'POW', 'SQRT', 'AND', 'OR', 'WHERE', 'GLOB'
  ];

  const allowedVariables = [
    'P1', 'P2', 'P3', 'F1', 'F2', 'P1_Gen', 'P2_Gen', 'P3_Gen', 'F1_Gen', 'F2_Gen', 'EZ_T', 'EZ_Base_T', 'EZ_T_ВИЭ', 'EZ_T_РЭК',
    'Pred_T', 'Wo_Prov_T', 'W_Prov_T', 'BE_T', 'OD_T', 'T_Coef', 'plan_t', 'direction',
  ];

  // Include existing formulas as variables
  const formulaVariables = existingFormulas.map((formula) => formula.name);

  // Merge allowed variables and formula variables
  const allVariables = [...allowedVariables, ...formulaVariables];

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = (newValue) => {
    setEditorValue(newValue);
    onChange(newValue);  // Pass the updated formula to parent component
  };

  // Define custom light theme colors
  const defineCustomTheme = (monaco) => {
    monaco.editor.defineTheme('customLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'D35400', fontStyle: 'bold' },
        { token: 'variable', foreground: '2980B9' },
        { token: 'number', foreground: '8E44AD' },
        { token: 'comment', foreground: '7F8C8D', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#FDFDFD',
        'editor.foreground': '#2C3E50',
        'editor.lineHighlightBackground': '#ECF0F1',
        'editorCursor.foreground': '#D35400',
        'editorIndentGuide.activeBackground': '#BDC3C7',
        'editorIndentGuide.background': '#E0E0E0',
      },
    });
  };

  // onMount gives access to the Monaco instance
  const handleEditorDidMount = (editor, monaco) => {
    defineCustomTheme(monaco);
    monaco.editor.setTheme('customLightTheme');

    // Register autocompletion for functions and variables
    monaco.languages.registerCompletionItemProvider('plaintext', {
      provideCompletionItems: () => {
        const suggestions = [
          ...allowedFunctions.map((func) => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${func}()`,
            documentation: `${func} функция`,
          })),
          ...allVariables.map((variable) => ({
            label: variable,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: variable,
            documentation: `Переменная ${variable}`,
          })),
        ];
        return { suggestions };
      },
    });
  };

  return (
    <Editor
      height="300px"
      defaultLanguage="plaintext"
      value={editorValue}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: 'on',
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
      }}
    />
  );
};

export default FormulaEditor;
