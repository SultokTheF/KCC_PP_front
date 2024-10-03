import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const FormulaEditor = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value);

  // Define the functions and variables
  const allowedFunctions = [
    'SUM', 'AVERAGE', 'AVG', 'MAX', 'MIN', 'COUNT', 'IF', 'ABS', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'POW', 'SQRT', 'AND', 'OR',
  ];

  const allowedVariables = [
    'P1', 'P2', 'P3', 'F1', 'F2', 'P1_Gen', 'P2_Gen', 'P3_Gen', 'F1_Gen', 'F2_Gen', 'EZ_T', 'EZ_Base_T', 'EZ_T_ВИЭ', 'EZ_T_РЭК', 
    'Pred_T', 'Wo_Prov_T', 'W_Prov_T', 'BE_T', 'OD_T', 'T_Coef', 'plan_t', 'direction',
  ];

  const handleEditorChange = (newValue) => {
    setEditorValue(newValue);
    onChange(newValue);  // Pass the updated formula to parent component
  };

  // Define custom light theme colors
  const defineCustomTheme = (monaco) => {
    monaco.editor.defineTheme('customLightTheme', {
      base: 'vs', // Light theme base
      inherit: true, // Inherit default light theme settings
      rules: [
        { token: 'keyword', foreground: 'D35400', fontStyle: 'bold' }, // Functions (Orange)
        { token: 'variable', foreground: '2980B9' },  // Variables (Blue)
        { token: 'number', foreground: '8E44AD' },    // Numbers (Purple)
        { token: 'comment', foreground: '7F8C8D', fontStyle: 'italic' }, // Comments (Grey with italic)
      ],
      colors: {
        'editor.background': '#FDFDFD',  // Light background
        'editor.foreground': '#2C3E50',  // Darker text color for contrast
        'editor.lineHighlightBackground': '#ECF0F1',  // Light line highlight color
        'editorCursor.foreground': '#D35400',  // Cursor color (Orange)
        'editorIndentGuide.activeBackground': '#BDC3C7',  // Indent guide color
        'editorIndentGuide.background': '#E0E0E0',
      },
    });
  };

  // onMount gives access to the Monaco instance
  const handleEditorDidMount = (editor, monaco) => {
    // Define the custom theme
    defineCustomTheme(monaco);

    // Set the theme to the editor
    monaco.editor.setTheme('customLightTheme');

    // Register autocompletion for functions and variables
    monaco.languages.registerCompletionItemProvider('plaintext', {
      provideCompletionItems: () => {
        const suggestions = [
          ...allowedFunctions.map(func => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${func}()`,
            documentation: `${func} function`,
          })),
          ...allowedVariables.map(variable => ({
            label: variable,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: variable,
            documentation: `${variable} variable`,
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
        fontSize: 14,  // Adjust font size
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
      }}
    />
  );
};

export default FormulaEditor;
